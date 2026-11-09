import "server-only";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { echec, succes, type Resultat } from "@/lib/resultat";
import { log } from "@/lib/journal";

/**
 * Service des crédits : SEUL point d'entrée pour modifier un solde.
 * Aucun autre code ne doit faire d'UPDATE direct sur `soldes_credits`.
 */

type TypeTransactionCredit =
  | "achat"
  | "bonus"
  | "debit"
  | "remboursement"
  | "ajustement"
  | "expiration";

type CanalEnvoi = "email" | "whatsapp" | "sms" | "appel";

export interface ParametresCrediter {
  entrepriseId: string;
  montant: number;
  type: TypeTransactionCredit;
  motif?: string;
  reference?: string;
  cleIdempotence?: string;
  expireLe?: Date | null;
}

export interface ParametresDebiter {
  entrepriseId: string;
  montant: number;
  motif: string;
  reference?: string;
  cleIdempotence: string;        // obligatoire : sécurité idempotente
  campagneId?: string;
  canal?: CanalEnvoi;
}

export interface ResultatDebit {
  solde: number;
  rejoue: boolean;               // vrai si c'était un replay
}

export type RaisonRefus =
  | "solde_insuffisant"
  | "plafond_jour"
  | "montant_doit_etre_positif"
  | "inconnu";

type LigneDebit = { ok: boolean; solde: number; raison: string };

/**
 * Crédite le solde d'une entreprise. Passe par la fonction SQL `crediter`.
 */
export async function crediter(
  p: ParametresCrediter,
): Promise<Resultat<number>> {
  if (p.montant <= 0) {
    return echec("Le montant doit être positif.", "montant_doit_etre_positif");
  }

  const client = creerClientAdmin();
  const { data, error } = await client.rpc("crediter", {
    entreprise: p.entrepriseId,
    montant: p.montant,
    type_tx: p.type,
    motif: p.motif ?? null,
    reference: p.reference ?? null,
    cle: p.cleIdempotence ?? null,
    expire_le: p.expireLe ? p.expireLe.toISOString() : null,
  });

  if (error) {
    log.error("crediter.rpc_error", { erreur: error.message });
    return echec("Impossible de créditer le solde pour le moment.", "db_error");
  }

  return succes(Number(data));
}

/**
 * Débite le solde. Idempotent via `cleIdempotence`.
 * Retourne `{ solde, rejoue }` en succès ; une `RaisonRefus` en échec.
 */
export async function debiter(
  p: ParametresDebiter,
): Promise<Resultat<ResultatDebit>> {
  if (p.montant <= 0) {
    return echec("Le montant doit être positif.", "montant_doit_etre_positif");
  }

  const client = creerClientAdmin();
  const { data, error } = await client.rpc("debiter", {
    entreprise: p.entrepriseId,
    montant: p.montant,
    motif: p.motif,
    reference: p.reference ?? null,
    cle: p.cleIdempotence,
    campagne: p.campagneId ?? null,
    canal_debit: p.canal ?? null,
  });

  if (error) {
    log.error("debiter.rpc_error", { erreur: error.message });
    return echec("Impossible de débiter le solde pour le moment.", "db_error");
  }

  const ligne = data as LigneDebit;

  if (!ligne.ok) {
    const raison = messageFrancais(ligne.raison);
    return echec(raison.message, raison.code);
  }

  return succes({
    solde: ligne.solde,
    rejoue: ligne.raison === "deja_debite",
  });
}

/**
 * Rembourse un débit par sa clé d'idempotence. Rejouable.
 */
export async function rembourser(
  cleDebit: string,
  motif = "message non livré",
): Promise<Resultat<number>> {
  const client = creerClientAdmin();
  const { data, error } = await client.rpc("rembourser", {
    cle_debit: cleDebit,
    motif,
  });

  if (error) {
    log.error("rembourser.rpc_error", { erreur: error.message, cleDebit });
    if (error.message.includes("debit_introuvable")) {
      return echec("Débit introuvable, rien à rembourser.", "debit_introuvable");
    }
    return echec("Impossible de rembourser pour le moment.", "db_error");
  }

  return succes(Number(data));
}

/** Lit le solde d'une entreprise (sans modifier l'état). */
export async function lireSolde(
  entrepriseId: string,
): Promise<Resultat<number>> {
  const client = creerClientAdmin();
  const { data, error } = await client
    .from("soldes_credits")
    .select("solde")
    .eq("entreprise_id", entrepriseId)
    .maybeSingle<{ solde: number }>();

  if (error) {
    log.error("lireSolde.db_error", { erreur: error.message });
    return echec("Lecture du solde impossible.", "db_error");
  }

  return succes(data?.solde ?? 0);
}

function messageFrancais(raison: string): { message: string; code: RaisonRefus } {
  switch (raison) {
    case "solde_insuffisant":
      return {
        message: "Crédits insuffisants pour effectuer cette action.",
        code: "solde_insuffisant",
      };
    case "plafond_jour":
      return {
        message: "Plafond de dépense journalier atteint pour cette campagne.",
        code: "plafond_jour",
      };
    case "montant_doit_etre_positif":
      return {
        message: "Le montant doit être positif.",
        code: "montant_doit_etre_positif",
      };
    default:
      return {
        message: "Débit refusé.",
        code: "inconnu",
      };
  }
}
