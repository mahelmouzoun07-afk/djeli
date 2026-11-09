"use server";

import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { exigerEnv } from "@/lib/env";
import { echec, succes, type Resultat } from "@/lib/resultat";
import { log } from "@/lib/journal";
import { normaliserTelephone } from "@/lib/donnees/telephone";
import { verifierLimite, reinitialiserLimite, empreinteIp } from "@/lib/auth/limites";
import {
  schemaInscription,
  schemaConnexion,
  schemaLienMagique,
  schemaMotDePasseOublie,
  schemaChangerMotDePasse,
  schemaCreerEntreprise,
  premierMessage,
} from "@/lib/auth/schemas";

/**
 * Server Actions d'authentification.
 *
 * Règle de sécurité commune : aucun message ne révèle si une adresse email
 * est déjà inscrite. On répond toujours la même chose, qu'elle existe ou non.
 */

const MESSAGE_NEUTRE =
  "Si ce compte existe, un email vient d'être envoyé. Pensez à regarder vos indésirables.";

const MESSAGE_TROP_DE_TENTATIVES =
  "Trop de tentatives. Patientez quelques minutes avant de réessayer.";

function urlRetour(chemin: string): string {
  const base = exigerEnv("APP_URL").replace(/\/+$/, "");
  return `${base}${chemin}`;
}

// ═════════════════════════════════════════════════════════════════════════
// Inscription
// ═════════════════════════════════════════════════════════════════════════

export async function inscription(
  brut: unknown,
): Promise<Resultat<{ emailAConfirmer: boolean }>> {
  const analyse = schemaInscription.safeParse(brut);
  if (!analyse.success) {
    return echec(premierMessage(analyse.error), "validation");
  }
  const d = analyse.data;

  // Limite par IP : empêche la création en masse de comptes
  const ip = await empreinteIp();
  if (!(await verifierLimite("inscription", ip))) {
    return echec(MESSAGE_TROP_DE_TENTATIVES, "trop_de_tentatives");
  }

  const telephone = d.telephone
    ? normaliserTelephone(d.telephone, d.pays)?.e164
    : null;

  const client = await creerClientServeur();
  const { data, error } = await client.auth.signUp({
    email: d.email,
    password: d.motDePasse,
    options: {
      emailRedirectTo: urlRetour(
        `/auth/callback?suivant=${encodeURIComponent("/demarrage")}`,
      ),
      data: {
        nom_complet: d.nomComplet,
        telephone,
        nom_entreprise: d.nomEntreprise,
        pays: d.pays,
        jeton_analyse: d.jetonAnalyse || null,
      },
    },
  });

  if (error) {
    log.warn("inscription.erreur", { code: error.code });
    // Email déjà pris : on ne le dit pas. Même réponse que pour un succès.
    if (error.code === "user_already_exists" || error.status === 422) {
      return succes({ emailAConfirmer: true });
    }
    if (error.code === "weak_password") {
      return echec(
        "Ce mot de passe est trop simple. Choisissez-en un plus long.",
        "mot_de_passe_faible",
      );
    }
    return echec(
      "La création du compte a échoué. Réessayez dans un instant.",
      "echec_inscription",
    );
  }

  // Session immédiate (confirmation email désactivée) : on crée l'entreprise
  if (data.session) {
    const r = await creerEntreprise({
      nomEntreprise: d.nomEntreprise,
      pays: d.pays,
      jetonAnalyse: d.jetonAnalyse || undefined,
    });
    if (!r.ok) return echec(r.erreur, r.code);
    return succes({ emailAConfirmer: false });
  }

  return succes({ emailAConfirmer: true });
}

// ═════════════════════════════════════════════════════════════════════════
// Création de l'entreprise (après inscription ou première connexion Google)
// ═════════════════════════════════════════════════════════════════════════

export async function creerEntreprise(
  brut: unknown,
): Promise<Resultat<{ entrepriseId: string }>> {
  const analyse = schemaCreerEntreprise.safeParse(brut);
  if (!analyse.success) {
    return echec(premierMessage(analyse.error), "validation");
  }
  const d = analyse.data;

  const client = await creerClientServeur();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return echec("Vous devez être connecté.", "non_authentifie");
  }

  const { data, error } = await client.rpc("creer_entreprise_pour_utilisateur", {
    nom: d.nomEntreprise,
    pays: d.pays,
    jeton_analyse: d.jetonAnalyse || null,
  });

  if (error) {
    log.error("creerEntreprise.rpc_error", {
      erreur: error.message,
      utilisateur: user.id,
    });
    return echec(
      "Impossible de créer votre espace. Réessayez dans un instant.",
      "echec_creation_entreprise",
    );
  }

  return succes({ entrepriseId: String(data) });
}

// ═════════════════════════════════════════════════════════════════════════
// Connexion
// ═════════════════════════════════════════════════════════════════════════

export async function connexion(brut: unknown): Promise<Resultat<null>> {
  const analyse = schemaConnexion.safeParse(brut);
  if (!analyse.success) {
    return echec(premierMessage(analyse.error), "validation");
  }
  const d = analyse.data;

  if (!(await verifierLimite("connexion", d.email))) {
    return echec(MESSAGE_TROP_DE_TENTATIVES, "trop_de_tentatives");
  }

  const client = await creerClientServeur();
  const { error } = await client.auth.signInWithPassword({
    email: d.email,
    password: d.motDePasse,
  });

  if (error) {
    log.warn("connexion.echec", { code: error.code });
    // Message identique que l'email existe ou non.
    return echec(
      "Adresse email ou mot de passe incorrect.",
      "identifiants_invalides",
    );
  }

  await reinitialiserLimite("connexion", d.email);
  return succes(null);
}

// ═════════════════════════════════════════════════════════════════════════
// Lien magique
// ═════════════════════════════════════════════════════════════════════════

export async function envoyerLienMagique(
  brut: unknown,
): Promise<Resultat<{ message: string }>> {
  const analyse = schemaLienMagique.safeParse(brut);
  if (!analyse.success) {
    return echec(premierMessage(analyse.error), "validation");
  }
  const d = analyse.data;

  if (!(await verifierLimite("connexion", d.email))) {
    return echec(MESSAGE_TROP_DE_TENTATIVES, "trop_de_tentatives");
  }

  const client = await creerClientServeur();
  const { error } = await client.auth.signInWithOtp({
    email: d.email,
    options: {
      emailRedirectTo: urlRetour(
        `/auth/callback?suivant=${encodeURIComponent("/tableau-de-bord")}`,
      ),
      shouldCreateUser: false, // l'inscription passe par le formulaire complet
    },
  });

  if (error) {
    log.warn("lienMagique.erreur", { code: error.code });
  }

  // Toujours la même réponse : ne révèle pas si le compte existe.
  return succes({ message: MESSAGE_NEUTRE });
}

// ═════════════════════════════════════════════════════════════════════════
// Google
// ═════════════════════════════════════════════════════════════════════════

export async function connexionGoogle(
  jetonAnalyse?: string,
): Promise<Resultat<{ url: string }>> {
  const client = await creerClientServeur();
  const suivant = "/auth/apres-connexion";
  const params = new URLSearchParams({ suivant });
  if (jetonAnalyse) params.set("jeton", jetonAnalyse);

  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: urlRetour(`/auth/callback?${params.toString()}`),
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error || !data.url) {
    log.error("connexionGoogle.erreur", { erreur: error?.message });
    return echec(
      "La connexion avec Google est indisponible pour le moment.",
      "echec_google",
    );
  }

  return succes({ url: data.url });
}

// ═════════════════════════════════════════════════════════════════════════
// Mot de passe
// ═════════════════════════════════════════════════════════════════════════

export async function motDePasseOublie(
  brut: unknown,
): Promise<Resultat<{ message: string }>> {
  const analyse = schemaMotDePasseOublie.safeParse(brut);
  if (!analyse.success) {
    return echec(premierMessage(analyse.error), "validation");
  }
  const d = analyse.data;

  if (!(await verifierLimite("connexion", d.email))) {
    return echec(MESSAGE_TROP_DE_TENTATIVES, "trop_de_tentatives");
  }

  const client = await creerClientServeur();
  const { error } = await client.auth.resetPasswordForEmail(d.email, {
    redirectTo: urlRetour("/auth/callback?suivant=/parametres/mot-de-passe"),
  });

  if (error) {
    log.warn("motDePasseOublie.erreur", { code: error.code });
  }

  return succes({ message: MESSAGE_NEUTRE });
}

export async function changerMotDePasse(
  brut: unknown,
): Promise<Resultat<null>> {
  const analyse = schemaChangerMotDePasse.safeParse(brut);
  if (!analyse.success) {
    return echec(premierMessage(analyse.error), "validation");
  }

  const client = await creerClientServeur();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return echec("Vous devez être connecté.", "non_authentifie");
  }

  const { error } = await client.auth.updateUser({
    password: analyse.data.nouveau,
  });

  if (error) {
    log.warn("changerMotDePasse.erreur", { code: error.code });
    if (error.code === "weak_password") {
      return echec(
        "Ce mot de passe est trop simple. Choisissez-en un plus long.",
        "mot_de_passe_faible",
      );
    }
    return echec(
      "Le changement de mot de passe a échoué.",
      "echec_changement",
    );
  }

  return succes(null);
}

// ═════════════════════════════════════════════════════════════════════════
// Déconnexion
// ═════════════════════════════════════════════════════════════════════════

export async function deconnexion(): Promise<never> {
  const client = await creerClientServeur();
  await client.auth.signOut();
  redirect("/connexion");
}
