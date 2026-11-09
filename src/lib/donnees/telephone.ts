// Variante `max` : seule à embarquer les métadonnées de TYPE de ligne,
// nécessaires pour distinguer un mobile d'un fixe (`getType()`).
// Les variantes par défaut et `min` renvoient toujours `undefined`.
import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/max";
import { trouverPays } from "./pays";

/**
 * Normalisation des numéros de téléphone au format E.164 (+22997000000).
 *
 * Tout le projet stocke les numéros dans ce format : c'est ce qu'attendent
 * WhatsApp, les agrégateurs SMS, et c'est ce qui permet de comparer de
 * façon fiable avec la liste des désinscriptions.
 */

export interface TelephoneNormalise {
  e164: string;
  pays: string;
  estMobile: boolean;
}

/**
 * Normalise un numéro saisi par un humain.
 * `paysParDefaut` sert quand le numéro est écrit sans indicatif (« 97 00 00 00 »).
 * Renvoie `null` si le numéro est invalide.
 */
export function normaliserTelephone(
  brut: string | null | undefined,
  paysParDefaut?: string | null,
): TelephoneNormalise | null {
  if (!brut || brut.trim() === "") return null;

  const codePays = paysParDefaut
    ? (trouverPays(paysParDefaut)?.code as CountryCode | undefined)
    : undefined;

  const numero = parsePhoneNumberFromString(brut.trim(), codePays);
  if (!numero || !numero.isValid()) return null;

  const type = numero.getType();
  return {
    e164: numero.number,
    pays: numero.country ?? paysParDefaut?.toUpperCase() ?? "",
    estMobile: type === "MOBILE" || type === "FIXED_LINE_OR_MOBILE",
  };
}

/** Vrai si le numéro est valide (et mobile si `exigerMobile`). */
export function estTelephoneValide(
  brut: string | null | undefined,
  paysParDefaut?: string | null,
  exigerMobile = false,
): boolean {
  const n = normaliserTelephone(brut, paysParDefaut);
  if (!n) return false;
  return exigerMobile ? n.estMobile : true;
}

/**
 * Affichage lisible d'un numéro E.164 : « +229 97 00 00 00 ».
 * Renvoie le numéro tel quel s'il ne peut pas être formaté.
 */
export function afficherTelephone(e164: string): string {
  const numero = parsePhoneNumberFromString(e164);
  return numero?.formatInternational() ?? e164;
}

/** Vrai si le numéro est un mobile (donc joignable par WhatsApp ou SMS). */
export function estMobile(
  brut: string | null | undefined,
  paysParDefaut?: string | null,
): boolean {
  return normaliserTelephone(brut, paysParDefaut)?.estMobile ?? false;
}
