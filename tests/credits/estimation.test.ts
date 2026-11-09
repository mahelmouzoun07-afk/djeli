import { describe, it, expect } from "vitest";
import { estimerCampagne } from "@/lib/credits/estimation";

describe("estimerCampagne", () => {
  it("1 PME, WhatsApp, 2 relances → max = 22 crédits (4 + 6 + 6 + 6)", () => {
    // Critère explicite du module : vérifier exactement ce chiffre.
    const r = estimerCampagne({
      nbProspects: 1,
      canaux: ["whatsapp"],
      relances: 2,
    });
    expect(r.creditsMax).toBe(22);
    // Hypothèse basse : analyse + 1 WhatsApp = 10
    expect(r.creditsMin).toBe(10);
    // 10 FCFA / crédit
    expect(r.fcfaMax).toBe(220);
    expect(r.fcfaMin).toBe(100);
  });

  it("100 PME, email seulement, 0 relance → 100 × (4 + 2) = 600 crédits", () => {
    const r = estimerCampagne({
      nbProspects: 100,
      canaux: ["email"],
      relances: 0,
    });
    expect(r.creditsMin).toBe(600);
    expect(r.creditsMax).toBe(600);
  });

  it("multicanal : prend le moins cher pour min, le plus cher pour max", () => {
    const r = estimerCampagne({
      nbProspects: 1,
      canaux: ["email", "whatsapp"],
      relances: 1,
    });
    // min : analyse(4) + email(2) = 6
    // max : analyse(4) + whatsapp(6) × 2 = 16
    expect(r.creditsMin).toBe(6);
    expect(r.creditsMax).toBe(16);
  });

  it("refuse 0 prospect", () => {
    expect(() =>
      estimerCampagne({ nbProspects: 0, canaux: ["email"], relances: 0 }),
    ).toThrow(/nbProspects/);
  });

  it("refuse 0 canal", () => {
    expect(() =>
      estimerCampagne({ nbProspects: 10, canaux: [], relances: 0 }),
    ).toThrow(/canal/);
  });

  it("refuse relances négatives", () => {
    expect(() =>
      estimerCampagne({ nbProspects: 10, canaux: ["email"], relances: -1 }),
    ).toThrow(/relances/);
  });
});
