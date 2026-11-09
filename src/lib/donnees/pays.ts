import type { CountryCode } from "libphonenumber-js";

/**
 * Pays où Djeli travaille.
 *
 * `afriqueOuest` : les 16 pays de la CEDEAO + la Mauritanie, où l'agent
 * prospecte et où l'annuaire est construit.
 * `diaspora` : pays d'où des clients peuvent s'inscrire pour viser
 * l'Afrique de l'Ouest (patrons expatriés, entreprises exportatrices).
 */

export interface Pays {
  code: CountryCode;
  nom: string;
  indicatif: string;
  fuseau: string;
  domaine?: string;
  /** Nom local de l'identifiant fiscal des entreprises. */
  identifiantFiscal?: string;
}

export const AFRIQUE_OUEST: readonly Pays[] = [
  { code: "BJ", nom: "Bénin", indicatif: "+229", fuseau: "Africa/Porto-Novo", domaine: ".bj", identifiantFiscal: "IFU" },
  { code: "BF", nom: "Burkina Faso", indicatif: "+226", fuseau: "Africa/Ouagadougou", domaine: ".bf", identifiantFiscal: "IFU" },
  { code: "CV", nom: "Cap-Vert", indicatif: "+238", fuseau: "Atlantic/Cape_Verde", domaine: ".cv", identifiantFiscal: "NIF" },
  { code: "CI", nom: "Côte d'Ivoire", indicatif: "+225", fuseau: "Africa/Abidjan", domaine: ".ci", identifiantFiscal: "NCC" },
  { code: "GM", nom: "Gambie", indicatif: "+220", fuseau: "Africa/Banjul", domaine: ".gm" },
  { code: "GH", nom: "Ghana", indicatif: "+233", fuseau: "Africa/Accra", domaine: ".gh", identifiantFiscal: "TIN" },
  { code: "GN", nom: "Guinée", indicatif: "+224", fuseau: "Africa/Conakry", domaine: ".gn", identifiantFiscal: "NIF" },
  { code: "GW", nom: "Guinée-Bissau", indicatif: "+245", fuseau: "Africa/Bissau", domaine: ".gw" },
  { code: "LR", nom: "Liberia", indicatif: "+231", fuseau: "Africa/Monrovia", domaine: ".lr" },
  { code: "ML", nom: "Mali", indicatif: "+223", fuseau: "Africa/Bamako", domaine: ".ml", identifiantFiscal: "NIF" },
  { code: "MR", nom: "Mauritanie", indicatif: "+222", fuseau: "Africa/Nouakchott", domaine: ".mr" },
  { code: "NE", nom: "Niger", indicatif: "+227", fuseau: "Africa/Niamey", domaine: ".ne", identifiantFiscal: "NIF" },
  { code: "NG", nom: "Nigeria", indicatif: "+234", fuseau: "Africa/Lagos", domaine: ".ng", identifiantFiscal: "TIN" },
  { code: "SN", nom: "Sénégal", indicatif: "+221", fuseau: "Africa/Dakar", domaine: ".sn", identifiantFiscal: "NINEA" },
  { code: "SL", nom: "Sierra Leone", indicatif: "+232", fuseau: "Africa/Freetown", domaine: ".sl" },
  { code: "TG", nom: "Togo", indicatif: "+228", fuseau: "Africa/Lome", domaine: ".tg", identifiantFiscal: "NIF" },
] as const;

/** Pays d'où un client peut s'inscrire sans être en Afrique de l'Ouest. */
export const DIASPORA: readonly Pays[] = [
  { code: "FR", nom: "France", indicatif: "+33", fuseau: "Europe/Paris" },
  { code: "BE", nom: "Belgique", indicatif: "+32", fuseau: "Europe/Brussels" },
  { code: "CH", nom: "Suisse", indicatif: "+41", fuseau: "Europe/Zurich" },
  { code: "CA", nom: "Canada", indicatif: "+1", fuseau: "America/Toronto" },
  { code: "US", nom: "États-Unis", indicatif: "+1", fuseau: "America/New_York" },
  { code: "GB", nom: "Royaume-Uni", indicatif: "+44", fuseau: "Europe/London" },
  { code: "MA", nom: "Maroc", indicatif: "+212", fuseau: "Africa/Casablanca" },
  { code: "TN", nom: "Tunisie", indicatif: "+216", fuseau: "Africa/Tunis" },
  { code: "CM", nom: "Cameroun", indicatif: "+237", fuseau: "Africa/Douala" },
  { code: "GA", nom: "Gabon", indicatif: "+241", fuseau: "Africa/Libreville" },
  { code: "CD", nom: "RD Congo", indicatif: "+243", fuseau: "Africa/Kinshasa" },
] as const;

export const PAYS_AUTORISES: readonly Pays[] = [...AFRIQUE_OUEST, ...DIASPORA];

const PAR_CODE = new Map<string, Pays>(
  PAYS_AUTORISES.map((p) => [p.code, p]),
);

export function trouverPays(code: string | null | undefined): Pays | null {
  if (!code) return null;
  return PAR_CODE.get(code.toUpperCase()) ?? null;
}

export function estPaysAutorise(code: string | null | undefined): boolean {
  return trouverPays(code) !== null;
}

export function estAfriqueOuest(code: string | null | undefined): boolean {
  if (!code) return false;
  return AFRIQUE_OUEST.some((p) => p.code === code.toUpperCase());
}

/** Fuseau horaire par défaut d'un pays ; Cotonou si inconnu. */
export function fuseauDuPays(code: string | null | undefined): string {
  return trouverPays(code)?.fuseau ?? "Africa/Porto-Novo";
}

export const CODES_AUTORISES: readonly string[] = PAYS_AUTORISES.map(
  (p) => p.code,
);
