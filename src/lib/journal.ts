/**
 * Journalisation minimale : une ligne JSON par événement, sur stdout/stderr.
 *
 * On branchera un vrai outil plus tard (Axiom, Datadog, Vercel logs).
 * Garder cette interface volontairement petite : chaque module s'y tient.
 *
 * Ne jamais y écrire de secret ni de donnée personnelle complète (pas de
 * mot de passe, pas de numéro entier, pas de jeton). Tronquer ou hacher.
 */

export type NiveauJournal = "debug" | "info" | "warn" | "error";

export interface EntreeJournal {
  horodatage: string;
  niveau: NiveauJournal;
  message: string;
  contexte?: Record<string, unknown>;
}

const NIVEAU_MIN: Record<NiveauJournal, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function seuilActif(): number {
  const brut = process.env.NIVEAU_JOURNAL?.toLowerCase();
  if (brut === "debug" || brut === "info" || brut === "warn" || brut === "error") {
    return NIVEAU_MIN[brut];
  }
  return process.env.NODE_ENV === "production" ? NIVEAU_MIN.info : NIVEAU_MIN.debug;
}

export function journal(
  niveau: NiveauJournal,
  message: string,
  contexte?: Record<string, unknown>,
): void {
  if (NIVEAU_MIN[niveau] < seuilActif()) return;

  const entree: EntreeJournal = {
    horodatage: new Date().toISOString(),
    niveau,
    message,
    ...(contexte ? { contexte } : {}),
  };

  const ligne = JSON.stringify(entree);
  if (niveau === "error") {
    console.error(ligne);
  } else if (niveau === "warn") {
    console.warn(ligne);
  } else {
    console.log(ligne);
  }
}

// Raccourcis
export const log = {
  debug: (m: string, c?: Record<string, unknown>) => journal("debug", m, c),
  info: (m: string, c?: Record<string, unknown>) => journal("info", m, c),
  warn: (m: string, c?: Record<string, unknown>) => journal("warn", m, c),
  error: (m: string, c?: Record<string, unknown>) => journal("error", m, c),
};
