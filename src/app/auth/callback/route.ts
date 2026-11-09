import { NextResponse, type NextRequest } from "next/server";
import { creerClientServeur } from "@/lib/supabase/server";
import { log } from "@/lib/journal";

/**
 * Point de retour de Supabase Auth : Google, lien magique, confirmation
 * d'email, réinitialisation de mot de passe.
 *
 * Supabase renvoie un `code` à échanger contre une session. Une fois la
 * session posée, on crée l'entreprise si c'est la première connexion, en
 * lisant les informations mises dans `user_metadata` à l'inscription.
 */

/** N'accepte qu'un chemin interne : empêche une redirection vers un autre site. */
function cheminInterne(valeur: string | null, defaut: string): string {
  if (!valeur) return defaut;
  if (!valeur.startsWith("/") || valeur.startsWith("//")) return defaut;
  return valeur;
}

export async function GET(requete: NextRequest) {
  const url = new URL(requete.url);
  const code = url.searchParams.get("code");
  const suivant = cheminInterne(
    url.searchParams.get("suivant"),
    "/tableau-de-bord",
  );
  const erreurFournisseur = url.searchParams.get("error");

  if (erreurFournisseur) {
    log.warn("callback.erreur_fournisseur", {
      erreur: erreurFournisseur,
      description: url.searchParams.get("error_description"),
    });
    return NextResponse.redirect(
      new URL("/connexion?erreur=lien_invalide", url.origin),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/connexion?erreur=lien_invalide", url.origin),
    );
  }

  const client = await creerClientServeur();
  const { data, error } = await client.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    log.warn("callback.echange_echoue", { erreur: error?.message });
    return NextResponse.redirect(
      new URL("/connexion?erreur=lien_expire", url.origin),
    );
  }

  // Première connexion ? Créer l'entreprise.
  const { data: membre } = await client
    .from("membres")
    .select("entreprise_id")
    .eq("profil_id", data.user.id)
    .limit(1)
    .maybeSingle<{ entreprise_id: string }>();

  if (!membre) {
    const metadonnees = data.user.user_metadata ?? {};
    const nomEntreprise =
      typeof metadonnees.nom_entreprise === "string"
        ? metadonnees.nom_entreprise
        : null;
    const pays = typeof metadonnees.pays === "string" ? metadonnees.pays : null;
    const jeton =
      url.searchParams.get("jeton") ??
      (typeof metadonnees.jeton_analyse === "string"
        ? metadonnees.jeton_analyse
        : null);

    if (nomEntreprise) {
      const { error: erreurCreation } = await client.rpc(
        "creer_entreprise_pour_utilisateur",
        { nom: nomEntreprise, pays, jeton_analyse: jeton },
      );
      if (erreurCreation) {
        log.error("callback.creation_entreprise_echouee", {
          erreur: erreurCreation.message,
          utilisateur: data.user.id,
        });
      }
    } else {
      // Arrivée par Google sans être passé par le formulaire : il manque le
      // nom de l'entreprise, on le demande.
      const vers = new URL("/inscription/entreprise", url.origin);
      if (jeton) vers.searchParams.set("jeton", jeton);
      return NextResponse.redirect(vers);
    }
  }

  return NextResponse.redirect(new URL(suivant, url.origin));
}
