/**
 * Types de la base Djeli.
 *
 * ⚠️ Ce fichier sera REMPLACÉ par `npm run db:types` dès qu'une instance
 * Supabase locale aura tourné. En attendant, il est écrit à la main pour
 * refléter exactement les migrations des modules 02 et 03, afin que le
 * projet compile en TypeScript strict.
 *
 * Quand une migration change le schéma : relancer `npm run db:types` et
 * commiter le fichier régénéré avec la migration.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ───── Enums (migration 20261109120000) ─────────────────────────────────

export type Canal = "email" | "whatsapp" | "sms" | "appel";
export type SensMessage = "sortant" | "entrant";
export type StatutMessage =
  | "brouillon"
  | "planifie"
  | "envoye"
  | "livre"
  | "lu"
  | "echoue"
  | "bloque";
export type StatutCampagne = "brouillon" | "active" | "en_pause" | "terminee";
export type StatutProspect =
  | "nouveau"
  | "analyse"
  | "contacte"
  | "a_repondu"
  | "interesse"
  | "rdv_pris"
  | "pas_interesse"
  | "desinscrit"
  | "injoignable";
export type ClasseReponse =
  | "interesse"
  | "question"
  | "pas_maintenant"
  | "refus"
  | "absent"
  | "desinscription"
  | "note_vocale_incomprise"
  | "autre";
export type TypeTransaction =
  | "achat"
  | "bonus"
  | "debit"
  | "remboursement"
  | "ajustement"
  | "expiration";
export type ModeRepartition = "automatique" | "manuel";
export type TypeCible = "entreprise" | "particulier";
export type RoleMembre = "proprietaire" | "membre";
export type StatutRdv = "propose" | "confirme" | "annule" | "honore" | "non_venu";
export type StatutPaiement = "en_attente" | "reussi" | "echoue" | "rembourse";
export type TypeIntegration = "google_agenda";

// ───── Helpers ───────────────────────────────────────────────────────────

/**
 * Aplatit une intersection en objet simple.
 *
 * Indispensable : les types Supabase exigent `Record<string, unknown>`,
 * ce qu'une `interface` ou une intersection brute ne satisfait pas.
 * D'où des `type` partout dans ce fichier, jamais d'`interface`.
 */
type Simplify<T> = { [K in keyof T]: T[K] };

/** Colonnes présentes sur toutes les tables. */
type Base = {
  id: string;
  cree_le: string;
  modifie_le: string;
};

/**
 * Construit le triplet Row / Insert / Update d'une table à partir de la
 * forme des lignes (`R`) et de la liste des colonnes obligatoires à
 * l'insertion (`Requis`). Tout le reste est optionnel à l'insertion
 * (valeurs par défaut en base), et tout est optionnel à la mise à jour.
 */
type Table<R, Requis extends keyof R = never> = {
  Row: R;
  Insert: Simplify<Pick<R, Requis> & Partial<Omit<R, Requis>>>;
  Update: Simplify<Partial<R>>;
  Relationships: [];
};

// ───── Lignes ────────────────────────────────────────────────────────────

export type LigneProfil = Simplify<Base & {
  nom_complet: string | null;
  telephone: string | null;
  langue: string;
  est_admin: boolean;
}>;

export type LigneEntreprise = Simplify<Base & {
  nom: string;
  site_web: string | null;
  description: string | null;
  pays: string | null;
  ville: string | null;
  secteur: string | null;
  analyse_ia: Json | null;
  analyse_le: string | null;
  style_valide: boolean;
  nom_signature: string | null;
  whatsapp_notification: string | null;
  fuseau_horaire: string;
  premier_achat_fait: boolean;
}>;

export type LigneMembre = Simplify<Base & {
  entreprise_id: string;
  profil_id: string;
  role: RoleMembre;
}>;

export type LigneProfilCible = Simplify<Base & {
  entreprise_id: string;
  nom: string;
  type_cible: TypeCible;
  secteurs: string[];
  tailles: string[];
  pays: string[];
  villes: string[];
  signaux_achat: string[];
  angle: string | null;
  actif: boolean;
}>;

export type LigneCampagne = Simplify<Base & {
  entreprise_id: string;
  profil_cible_id: string | null;
  nom: string;
  statut: StatutCampagne;
  canaux_autorises: Canal[];
  mode_repartition: ModeRepartition;
  repartition: Json | null;
  plafond_credits_jour: number | null;
  sequence: Json | null;
  demarree_le: string | null;
  terminee_le: string | null;
}>;

export type LigneProspect = Simplify<Base & {
  entreprise_id: string;
  campagne_id: string;
  annuaire_entreprise_id: string | null;
  annuaire_contact_id: string | null;
  type_cible: TypeCible;
  nom_entreprise: string | null;
  nom_contact: string | null;
  poste: string | null;
  email: string | null;
  telephone: string | null;
  whatsapp: string | null;
  pays: string | null;
  langue: string | null;
  score_adequation: number | null;
  analyse_ia: Json | null;
  canal_prefere: Canal | null;
  statut: StatutProspect;
  source: string | null;
  base_legale: string | null;
}>;

export type LigneBoiteEnvoi = Simplify<Base & {
  adresse: string;
  domaine: string;
  fournisseur: string;
  quota_jour: number;
  envoyes_aujourdhui: number;
  sante: number;
  en_pause: boolean;
  raison_pause: string | null;
  identifiants_ref: string;
}>;

export type LigneNumeroDjeli = Simplify<Base & {
  canal: Canal;
  pays: string;
  numero_e164: string;
  id_fournisseur: string | null;
  note_qualite: number | null;
  limite_jour: number;
  envoyes_aujourdhui: number;
  en_pause: boolean;
}>;

export type LigneMessage = Simplify<Base & {
  entreprise_id: string;
  prospect_id: string;
  campagne_id: string;
  canal: Canal;
  sens: SensMessage;
  statut: StatutMessage;
  etape_sequence: number | null;
  sujet: string | null;
  corps: string | null;
  id_externe: string | null;
  boite_envoi_id: string | null;
  numero_djeli_id: string | null;
  planifie_pour: string | null;
  envoye_le: string | null;
  erreur: string | null;
  credits_debites: number;
  classe: ClasseReponse | null;
  piece_jointe_url: string | null;
}>;

export type LigneConversation = Simplify<Base & {
  entreprise_id: string;
  prospect_id: string;
  canal: Canal;
  dernier_message_le: string | null;
  fenetre_24h_jusqua: string | null;
  en_attente_client: boolean;
}>;

export type LigneRendezVous = Simplify<Base & {
  entreprise_id: string;
  prospect_id: string;
  debut: string;
  fin: string;
  lieu_ou_lien: string | null;
  google_event_id: string | null;
  statut: StatutRdv;
  rappel_envoye: boolean;
}>;

export type LigneIntegration = Simplify<Base & {
  entreprise_id: string;
  type: TypeIntegration;
  jeton_ref: string;
  actif: boolean;
}>;

export type LigneSoldeCredits = Simplify<Base & {
  entreprise_id: string;
  solde: number;
  reference_alerte: number | null;
  alerte_20_envoyee: boolean;
  alerte_5_envoyee: boolean;
}>;

/**
 * Un lot = un achat de crédits avec sa date d'expiration.
 * Les débits consomment les lots du plus proche de l'expiration au plus
 * lointain (FIFO). La somme des `restant` doit toujours égaler le solde.
 */
export type LigneLotCredits = Simplify<Base & {
  entreprise_id: string;
  transaction_id: string | null;
  montant_initial: number;
  restant: number;
  expire_le: string | null;
}>;

export type LigneTransactionCredits = Simplify<Base & {
  entreprise_id: string;
  type: TypeTransaction;
  montant: number;
  solde_apres: number;
  motif: string | null;
  reference: string | null;
  cle_idempotence: string | null;
  expire_le: string | null;
}>;

export type LigneDepenseJour = Simplify<Base & {
  entreprise_id: string;
  campagne_id: string;
  jour: string;
  canal: Canal;
  credits: number;
}>;

export type LignePaiement = Simplify<Base & {
  entreprise_id: string;
  prestataire: string;
  montant_fcfa: number;
  credits: number;
  bonus: number;
  statut: StatutPaiement;
  reference_externe: string | null;
  telephone_payeur: string | null;
  operateur: string | null;
  brut: Json | null;
}>;

export type LigneOptOut = Simplify<Base & {
  valeur: string;
  canal: Canal | null;
  raison: string | null;
}>;

export type LigneContactRecent = Simplify<Base & {
  valeur: string;
  dernier_premier_message_le: string;
}>;

export type LigneJourFerie = Simplify<Base & {
  pays: string;
  jour: string;
  nom: string;
}>;

export type LigneJournalEvenement = Simplify<Base & {
  entreprise_id: string | null;
  type: string;
  donnees: Json | null;
}>;

// ───── Schéma ────────────────────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      profils: Table<LigneProfil, "id">;
      entreprises: Table<LigneEntreprise, "nom">;
      membres: Table<LigneMembre, "entreprise_id" | "profil_id">;
      profils_cibles: Table<LigneProfilCible, "entreprise_id" | "nom">;
      campagnes: Table<LigneCampagne, "entreprise_id" | "nom">;
      prospects: Table<LigneProspect, "entreprise_id" | "campagne_id">;
      boites_envoi: Table<
        LigneBoiteEnvoi,
        "adresse" | "domaine" | "fournisseur" | "identifiants_ref"
      >;
      numeros_djeli: Table<LigneNumeroDjeli, "canal" | "pays" | "numero_e164">;
      messages: Table<
        LigneMessage,
        "entreprise_id" | "prospect_id" | "campagne_id" | "canal" | "sens"
      >;
      conversations: Table<
        LigneConversation,
        "entreprise_id" | "prospect_id" | "canal"
      >;
      rendez_vous: Table<
        LigneRendezVous,
        "entreprise_id" | "prospect_id" | "debut" | "fin"
      >;
      integrations: Table<
        LigneIntegration,
        "entreprise_id" | "type" | "jeton_ref"
      >;
      soldes_credits: Table<LigneSoldeCredits, "entreprise_id">;
      lots_credits: Table<
        LigneLotCredits,
        "entreprise_id" | "montant_initial" | "restant"
      >;
      transactions_credits: Table<
        LigneTransactionCredits,
        "entreprise_id" | "type" | "montant" | "solde_apres"
      >;
      depenses_jour: Table<
        LigneDepenseJour,
        "entreprise_id" | "campagne_id" | "jour" | "canal"
      >;
      paiements: Table<
        LignePaiement,
        "entreprise_id" | "prestataire" | "montant_fcfa" | "credits"
      >;
      opt_outs: Table<LigneOptOut, "valeur">;
      contacts_recents: Table<LigneContactRecent, "valeur">;
      jours_feries: Table<LigneJourFerie, "pays" | "jour" | "nom">;
      journal_evenements: Table<LigneJournalEvenement, "type">;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      est_membre: {
        Args: { entreprise: string };
        Returns: boolean;
      };
      est_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      crediter: {
        Args: {
          entreprise: string;
          montant: number;
          type_tx: TypeTransaction;
          motif: string | null;
          reference: string | null;
          cle: string | null;
          expire_le: string | null;
        };
        Returns: number;
      };
      debiter: {
        Args: {
          entreprise: string;
          montant: number;
          motif: string;
          reference: string | null;
          cle: string;
          campagne: string | null;
          canal_debit: Canal | null;
        };
        Returns: { ok: boolean; solde: number; raison: string };
      };
      rembourser: {
        Args: { cle_debit: string; motif: string };
        Returns: number;
      };
      /** Interne : appelée par debiter(), jamais directement. */
      consommer_lots: {
        Args: { entreprise: string; montant: number };
        Returns: undefined;
      };
      expirer_credits: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: {
      canal: Canal;
      sens_message: SensMessage;
      statut_message: StatutMessage;
      statut_campagne: StatutCampagne;
      statut_prospect: StatutProspect;
      classe_reponse: ClasseReponse;
      type_transaction: TypeTransaction;
      mode_repartition: ModeRepartition;
      type_cible: TypeCible;
      role_membre: RoleMembre;
      statut_rdv: StatutRdv;
      statut_paiement: StatutPaiement;
      type_integration: TypeIntegration;
    };
    CompositeTypes: {
      resultat_debit: {
        ok: boolean;
        solde: number;
        raison: string;
      };
    };
  };
};
