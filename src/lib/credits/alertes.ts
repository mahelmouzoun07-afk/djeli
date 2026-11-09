import "server-only";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { log } from "@/lib/journal";

/**
 * Après chaque débit, vérifie si le solde a franchi les seuils 20 % et 5 %
 * du dernier rechargement. Si oui, crée un événement « alerte_solde »
 * (l'envoi réel du message au client est au module 13).
 *
 * Idempotent : les drapeaux `alerte_20_envoyee` et `alerte_5_envoyee` sur
 * `soldes_credits` empêchent de créer la même alerte deux fois par cycle.
 * Ils sont remis à false par la fonction SQL `crediter` après un achat/bonus.
 */

export type NiveauAlerte = 20 | 5;

export async function verifierSeuilsApresDebit(
  entrepriseId: string,
): Promise<NiveauAlerte | null> {
  const client = creerClientAdmin();

  const { data: solde, error } = await client
    .from("soldes_credits")
    .select("solde, reference_alerte, alerte_20_envoyee, alerte_5_envoyee")
    .eq("entreprise_id", entrepriseId)
    .maybeSingle<{
      solde: number;
      reference_alerte: number | null;
      alerte_20_envoyee: boolean;
      alerte_5_envoyee: boolean;
    }>();

  if (error || !solde || !solde.reference_alerte || solde.reference_alerte <= 0) {
    return null;
  }

  const ratio = solde.solde / solde.reference_alerte;
  let niveau: NiveauAlerte | null = null;

  // 5 % d'abord : le franchissement bas inclut aussi les 20 %
  if (ratio <= 0.05 && !solde.alerte_5_envoyee) {
    niveau = 5;
  } else if (ratio <= 0.2 && !solde.alerte_20_envoyee) {
    niveau = 20;
  }

  if (niveau === null) return null;

  // Événement visible au module 13 pour l'envoi au client
  const { error: errEvt } = await client.from("journal_evenements").insert({
    entreprise_id: entrepriseId,
    type: niveau === 5 ? "alerte_solde_5" : "alerte_solde_20",
    donnees: {
      solde: solde.solde,
      reference: solde.reference_alerte,
      ratio,
    },
  });
  if (errEvt) {
    log.error("alertes.journal_evenements_error", { erreur: errEvt.message });
    return null;
  }

  // Marque l'alerte comme envoyée (on marque aussi 20 quand 5 est atteint)
  const miseAJour =
    niveau === 5
      ? { alerte_5_envoyee: true, alerte_20_envoyee: true }
      : { alerte_20_envoyee: true };

  const { error: errMaj } = await client
    .from("soldes_credits")
    .update(miseAJour)
    .eq("entreprise_id", entrepriseId);

  if (errMaj) {
    log.error("alertes.flag_error", { erreur: errMaj.message });
  }

  return niveau;
}
