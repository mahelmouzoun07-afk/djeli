import { describe, it, expect } from "vitest";
import {
  succes,
  echec,
  estSucces,
  estEchec,
  type Resultat,
} from "@/lib/resultat";

describe("Resultat", () => {
  it("succes renvoie un objet ok avec les données", () => {
    const r = succes(42);
    expect(r).toEqual({ ok: true, donnees: 42 });
  });

  it("echec renvoie un objet non-ok avec un message en français", () => {
    const r = echec("Solde insuffisant", "solde_insuffisant");
    expect(r).toEqual({
      ok: false,
      erreur: "Solde insuffisant",
      code: "solde_insuffisant",
    });
  });

  it("echec sans code reste valide", () => {
    const r = echec("Erreur inconnue");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erreur).toBe("Erreur inconnue");
      expect(r.code).toBeUndefined();
    }
  });

  it("estSucces discrimine correctement et rétrécit le type", () => {
    const r: Resultat<string> = succes("bonjour");
    expect(estSucces(r)).toBe(true);
    if (estSucces(r)) {
      // Le type est maintenant { ok: true; donnees: string }
      expect(r.donnees.toUpperCase()).toBe("BONJOUR");
    }
  });

  it("estEchec discrimine correctement et rétrécit le type", () => {
    const r: Resultat<string> = echec("non");
    expect(estEchec(r)).toBe(true);
    if (estEchec(r)) {
      expect(r.erreur).toBe("non");
    }
  });
});
