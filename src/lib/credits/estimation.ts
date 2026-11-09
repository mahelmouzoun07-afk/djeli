import { coutAction, creditsEnFcfa } from "./couts";

/**
 * Estimation avant lancement d'une campagne : affichée au client AVANT
 * qu'il engage ses crédits. L'objectif est de donner une fourchette
 * honnête, pas une promesse.
 *
 * Hypothèse basse : le prospect répond au 1ᵉʳ message (analyse + 1 envoi).
 * Hypothèse haute : aucune réponse, toutes les relances partent (analyse +
 *                   1 + relances × le canal le plus cher activé).
 */
export type CanalCampagne = "email" | "whatsapp" | "sms";

export interface ParamsEstimation {
  nbProspects: number;
  canaux: CanalCampagne[];      // au moins 1
  relances: number;             // nombre MAXIMUM de relances après le 1ᵉʳ message
}

export interface EstimationCampagne {
  nbProspects: number;
  creditsMin: number;
  creditsMax: number;
  fcfaMin: number;
  fcfaMax: number;
  detail: {
    coutAnalyse: number;        // par prospect
    coutPremierMessage: {
      min: number;              // canal le moins cher activé
      max: number;              // canal le plus cher activé
    };
    coutRelance: {
      min: number;
      max: number;
    };
  };
}

export function estimerCampagne(p: ParamsEstimation): EstimationCampagne {
  if (p.nbProspects <= 0) {
    throw new Error("nbProspects doit être positif");
  }
  if (p.canaux.length === 0) {
    throw new Error("au moins un canal est requis");
  }
  if (p.relances < 0) {
    throw new Error("relances doit être >= 0");
  }

  const couts = p.canaux.map((c) => coutParCanal(c));
  const coutMin = Math.min(...couts);
  const coutMax = Math.max(...couts);
  const coutAnalyse = coutAction("analyse_prospect");

  // Par prospect : hypothèse basse → analyse + 1 envoi au canal le moins cher
  const minParProspect = coutAnalyse + coutMin;
  // Par prospect : hypothèse haute → analyse + (1 + relances) envois au canal
  // le plus cher (c'est l'ordre d'enchaînement le plus coûteux)
  const maxParProspect = coutAnalyse + coutMax * (1 + p.relances);

  const creditsMin = minParProspect * p.nbProspects;
  const creditsMax = maxParProspect * p.nbProspects;

  return {
    nbProspects: p.nbProspects,
    creditsMin,
    creditsMax,
    fcfaMin: creditsEnFcfa(creditsMin),
    fcfaMax: creditsEnFcfa(creditsMax),
    detail: {
      coutAnalyse,
      coutPremierMessage: { min: coutMin, max: coutMax },
      coutRelance: { min: coutMin, max: coutMax },
    },
  };
}

function coutParCanal(c: CanalCampagne): number {
  switch (c) {
    case "email":
      return coutAction("email");
    case "whatsapp":
      return coutAction("whatsapp_message");
    case "sms":
      return coutAction("sms");
  }
}
