import "server-only";
import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { log } from "@/lib/journal";

/**
 * Gardes d'accès pour les Server Components et les Server Actions.
 *
 * Le proxy (src/proxy.ts) bloque déjà les visiteurs non connectés sur les
 * routes de l'espace client. Ces fonctions font la deuxième vérification,
 * côté données : elles donnent l'utilisateur et son entreprise, ou
 * redirigent. Ne jamais faire confiance au seul proxy.
 */

export interface UtilisateurConnecte {
  id: string;
  email: string | null;
}

export interface EntrepriseDeLUtilisateur {
  utilisateur: UtilisateurConnecte;
  entrepriseId: string;
  nomEntreprise: string;
  premierAchatFait: boolean;
}

/** Renvoie l'utilisateur connecté, ou redirige vers /connexion. */
export async function exigerUtilisateur(): Promise<UtilisateurConnecte> {
  const client = await creerClientServeur();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  return { id: user.id, email: user.email ?? null };
}

/** Renvoie l'utilisateur connecté, ou `null` s'il ne l'est pas. */
export async function utilisateurOuNull(): Promise<UtilisateurConnecte | null> {
  const client = await creerClientServeur();
  const {
    data: { user },
  } = await client.auth.getUser();
  return user ? { id: user.id, email: user.email ?? null } : null;
}

/**
 * Renvoie l'entreprise de l'utilisateur connecté.
 *
 * - Pas connecté → /connexion
 * - Connecté mais sans entreprise → /inscription/entreprise
 * - Entreprise sans premier achat → /credits, sauf si `autoriserSansCredits`
 *   (la page /credits et /parametres doivent rester accessibles)
 */
export async function exigerEntreprise(options?: {
  autoriserSansCredits?: boolean;
}): Promise<EntrepriseDeLUtilisateur> {
  const utilisateur = await exigerUtilisateur();
  const client = await creerClientServeur();

  const { data, error } = await client
    .from("membres")
    .select("entreprise_id, entreprises(nom, premier_achat_fait)")
    .eq("profil_id", utilisateur.id)
    .limit(1)
    .maybeSingle<{
      entreprise_id: string;
      entreprises: { nom: string; premier_achat_fait: boolean } | null;
    }>();

  if (error) {
    log.error("exigerEntreprise.db_error", {
      erreur: error.message,
      utilisateur: utilisateur.id,
    });
    redirect("/connexion");
  }

  if (!data || !data.entreprises) {
    redirect("/inscription/entreprise");
  }

  const resultat: EntrepriseDeLUtilisateur = {
    utilisateur,
    entrepriseId: data.entreprise_id,
    nomEntreprise: data.entreprises.nom,
    premierAchatFait: data.entreprises.premier_achat_fait,
  };

  if (!resultat.premierAchatFait && !options?.autoriserSansCredits) {
    redirect("/credits");
  }

  return resultat;
}

/** Comme `exigerEntreprise`, mais sans redirection : renvoie `null`. */
export async function entrepriseOuNull(): Promise<EntrepriseDeLUtilisateur | null> {
  const utilisateur = await utilisateurOuNull();
  if (!utilisateur) return null;

  const client = await creerClientServeur();
  const { data } = await client
    .from("membres")
    .select("entreprise_id, entreprises(nom, premier_achat_fait)")
    .eq("profil_id", utilisateur.id)
    .limit(1)
    .maybeSingle<{
      entreprise_id: string;
      entreprises: { nom: string; premier_achat_fait: boolean } | null;
    }>();

  if (!data || !data.entreprises) return null;

  return {
    utilisateur,
    entrepriseId: data.entreprise_id,
    nomEntreprise: data.entreprises.nom,
    premierAchatFait: data.entreprises.premier_achat_fait,
  };
}
