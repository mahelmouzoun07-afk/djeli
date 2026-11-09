import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { log } from "@/lib/journal";

/**
 * Limite de fréquence, stockée en base (table `tentatives`).
 *
 * Choix de la base plutôt qu'un service externe (Upstash) : une dépendance
 * et un secret de moins, et le volume attendu au lancement est faible.
 * À revoir si la charge augmente : les compteurs en base coûtent une
 * requête par tentative.
 */

export type ActionLimitee = "connexion" | "inscription" | "analyse";

interface Regle {
  maximum: number;
  fenetreSql: string; // intervalle Postgres
}

/** Les limites du module 04. */
const REGLES: Record<ActionLimitee, Regle> = {
  connexion: { maximum: 5, fenetreSql: "15 minutes" },
  inscription: { maximum: 3, fenetreSql: "1 hour" },
  analyse: { maximum: 5, fenetreSql: "1 hour" },
};

/**
 * Vérifie et enregistre une tentative.
 * Renvoie `true` si l'action est autorisée.
 *
 * En cas d'erreur technique, on autorise (on ne bloque pas un client
 * légitime parce que la base a hoqueté), mais on journalise.
 */
export async function verifierLimite(
  action: ActionLimitee,
  identifiant: string,
): Promise<boolean> {
  const regle = REGLES[action];
  const cle = `${action}:${identifiant.toLowerCase()}`;

  try {
    const client = creerClientAdmin();
    const { data, error } = await client.rpc("verifier_limite", {
      cle,
      action,
      maximum: regle.maximum,
      fenetre: regle.fenetreSql,
    });

    if (error) {
      log.warn("limites.rpc_error", { erreur: error.message, action });
      return true;
    }
    return data === true;
  } catch (e) {
    log.warn("limites.exception", {
      erreur: e instanceof Error ? e.message : String(e),
      action,
    });
    return true;
  }
}

/** Efface le compteur après un succès (connexion réussie, par exemple). */
export async function reinitialiserLimite(
  action: ActionLimitee,
  identifiant: string,
): Promise<void> {
  try {
    const client = creerClientAdmin();
    await client.rpc("reinitialiser_limite", {
      cle: `${action}:${identifiant.toLowerCase()}`,
      action,
    });
  } catch (e) {
    log.warn("limites.reset_exception", {
      erreur: e instanceof Error ? e.message : String(e),
    });
  }
}

/**
 * Empreinte de l'IP de la requête, pour limiter sans stocker l'IP en clair.
 * Le sel rend l'empreinte inutilisable hors de ce projet.
 */
export async function empreinteIp(): Promise<string> {
  const entetes = await headers();
  const brut =
    entetes.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    entetes.get("x-real-ip") ??
    "inconnue";

  const sel = process.env.SEL_EMPREINTE_IP ?? "djeli";
  return createHash("sha256").update(`${sel}:${brut}`).digest("hex").slice(0, 32);
}
