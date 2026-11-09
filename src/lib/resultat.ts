/**
 * Type `Resultat<T>` : façon uniforme de renvoyer un succès ou une erreur
 * depuis les Server Actions et les fonctions métier, sans lancer d'exception.
 *
 * - `ok: true` → les données sont dans `donnees`
 * - `ok: false` → le message pour l'utilisateur est dans `erreur` (en français)
 *                 ; un `code` optionnel permet au code appelant de réagir
 */
export type Resultat<T> =
  | { ok: true; donnees: T }
  | { ok: false; erreur: string; code?: string };

export function succes<T>(donnees: T): Resultat<T> {
  return { ok: true, donnees };
}

export function echec<T = never>(erreur: string, code?: string): Resultat<T> {
  return { ok: false, erreur, code };
}

/** Vrai si `r` est un succès. Rétrécit le type pour TypeScript. */
export function estSucces<T>(
  r: Resultat<T>,
): r is { ok: true; donnees: T } {
  return r.ok;
}

/** Vrai si `r` est un échec. */
export function estEchec<T>(
  r: Resultat<T>,
): r is { ok: false; erreur: string; code?: string } {
  return !r.ok;
}
