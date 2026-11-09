/**
 * Types générés par Supabase : à régénérer après chaque migration.
 *
 *   npm run db:types
 *
 * Tant que Supabase n'a pas été lancé une première fois sur cette machine,
 * on garde ici une définition `unknown` qui laisse le projet compiler.
 * Les modules métier typent ensuite leurs requêtes explicitement.
 *
 * Ce fichier est commité : il représente la forme attendue par le code.
 * Quand une migration change le schéma, relance `npm run db:types` et
 * commit le nouveau fichier avec la migration.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }>;
    Views: Record<string, { Row: Record<string, unknown> }>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: {
      canal: "email" | "whatsapp" | "sms" | "appel";
      sens_message: "sortant" | "entrant";
      statut_message:
        | "brouillon"
        | "planifie"
        | "envoye"
        | "livre"
        | "lu"
        | "echoue"
        | "bloque";
      statut_campagne: "brouillon" | "active" | "en_pause" | "terminee";
      statut_prospect:
        | "nouveau"
        | "analyse"
        | "contacte"
        | "a_repondu"
        | "interesse"
        | "rdv_pris"
        | "pas_interesse"
        | "desinscrit"
        | "injoignable";
      classe_reponse:
        | "interesse"
        | "question"
        | "pas_maintenant"
        | "refus"
        | "absent"
        | "desinscription"
        | "note_vocale_incomprise"
        | "autre";
      type_transaction:
        | "achat"
        | "bonus"
        | "debit"
        | "remboursement"
        | "ajustement"
        | "expiration";
      mode_repartition: "automatique" | "manuel";
      type_cible: "entreprise" | "particulier";
      role_membre: "proprietaire" | "membre";
      statut_rdv: "propose" | "confirme" | "annule" | "honore" | "non_venu";
      statut_paiement: "en_attente" | "reussi" | "echoue" | "rembourse";
      type_integration: "google_agenda";
    };
    CompositeTypes: Record<string, never>;
  };
};
