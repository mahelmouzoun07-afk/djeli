"use server";

import { creerClientServeur } from "@/lib/supabase/server";
import { echec, succes, type Resultat } from "@/lib/resultat";
import { log } from "@/lib/journal";

/**
 * Server Actions appelées par la page /credits.
 *
 * Toutes les lectures passent par le client RLS (clé anon + session de
 * l'utilisateur) : le client ne voit JAMAIS les soldes des autres entreprises.
 */

export interface SoldeAffiche {
  solde: number;
  referenceAlerte: number | null;
  alerteDouceEnvoyee: boolean;    // 20 %
  alerteGraveEnvoyee: boolean;    // 5 %
}

/** Récupère le solde de l'entreprise courante. */
export async function obtenirSolde(
  entrepriseId: string,
): Promise<Resultat<SoldeAffiche>> {
  const client = await creerClientServeur();
  const { data, error } = await client
    .from("soldes_credits")
    .select("solde, reference_alerte, alerte_20_envoyee, alerte_5_envoyee")
    .eq("entreprise_id", entrepriseId)
    .maybeSingle<{
      solde: number;
      reference_alerte: number | null;
      alerte_20_envoyee: boolean;
      alerte_5_envoyee: boolean;
    }>();

  if (error) {
    log.error("obtenirSolde.db_error", { erreur: error.message });
    return echec("Impossible de lire votre solde pour le moment.", "db_error");
  }

  if (!data) {
    // Pas de ligne encore = première visite, solde à 0
    return succes({
      solde: 0,
      referenceAlerte: null,
      alerteDouceEnvoyee: false,
      alerteGraveEnvoyee: false,
    });
  }

  return succes({
    solde: data.solde,
    referenceAlerte: data.reference_alerte,
    alerteDouceEnvoyee: data.alerte_20_envoyee,
    alerteGraveEnvoyee: data.alerte_5_envoyee,
  });
}

export interface LigneHistorique {
  id: string;
  type: string;
  montant: number;
  soldeApres: number;
  motif: string | null;
  reference: string | null;
  creeLe: string;
  expireLe: string | null;
}

export interface Pagination {
  page: number;
  taillePage: number;
}

/** Historique paginé des transactions. 25 lignes par page par défaut. */
export async function obtenirHistorique(
  entrepriseId: string,
  pagination?: Pagination,
): Promise<Resultat<{ lignes: LigneHistorique[]; page: number; taillePage: number }>> {
  const page = Math.max(1, Math.floor(pagination?.page ?? 1));
  const taillePage = Math.min(100, Math.max(1, Math.floor(pagination?.taillePage ?? 25)));
  const debut = (page - 1) * taillePage;
  const fin = debut + taillePage - 1;

  const client = await creerClientServeur();
  const { data, error } = await client
    .from("transactions_credits")
    .select("id, type, montant, solde_apres, motif, reference, cree_le, expire_le")
    .eq("entreprise_id", entrepriseId)
    .order("cree_le", { ascending: false })
    .range(debut, fin);

  if (error) {
    log.error("obtenirHistorique.db_error", { erreur: error.message });
    return echec("Impossible de lire votre historique.", "db_error");
  }

  type LigneBrute = {
    id: string;
    type: string;
    montant: number;
    solde_apres: number;
    motif: string | null;
    reference: string | null;
    cree_le: string;
    expire_le: string | null;
  };

  const lignes: LigneHistorique[] = ((data as LigneBrute[] | null) ?? []).map((l) => ({
    id: l.id,
    type: l.type,
    montant: l.montant,
    soldeApres: l.solde_apres,
    motif: l.motif,
    reference: l.reference,
    creeLe: l.cree_le,
    expireLe: l.expire_le,
  }));

  return succes({ lignes, page, taillePage });
}
