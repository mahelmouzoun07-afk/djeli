import { credits } from "@/lib/constants";

/**
 * Catalogue des actions payantes. Les noms sont stables (utilisés comme
 * clés d'idempotence et motifs dans les transactions).
 *
 * Toute action gratuite (analyse d'activité, conversation après réponse,
 * rendez-vous) n'apparaît PAS ici : l'appelant sait qu'elle ne coûte rien.
 */
export type ActionPayante =
  | "analyse_prospect"
  | "email"
  | "whatsapp_message"
  | "sms"
  | "appel";

/**
 * Coût d'une action, en crédits. Jamais de nombre à virgule.
 * Pour les appels, les minutes sont arrondies à l'entier supérieur
 * (« minute commencée »).
 */
export function coutAction(
  action: ActionPayante,
  options?: { minutes?: number },
): number {
  switch (action) {
    case "analyse_prospect":
      return credits.costs.analyse_prospect;
    case "email":
      return credits.costs.email;
    case "whatsapp_message":
      return credits.costs.whatsapp_message;
    case "sms":
      return credits.costs.sms;
    case "appel": {
      const minutes = Math.max(1, Math.ceil(options?.minutes ?? 1));
      return credits.costs.call_per_minute * minutes;
    }
  }
}

/** Nombre de FCFA correspondant à un montant en crédits. */
export function creditsEnFcfa(nbCredits: number): number {
  return nbCredits * credits.unitValue;
}
