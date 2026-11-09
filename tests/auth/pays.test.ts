import { describe, it, expect } from "vitest";
import {
  AFRIQUE_OUEST,
  DIASPORA,
  trouverPays,
  estPaysAutorise,
  estAfriqueOuest,
  fuseauDuPays,
  CODES_AUTORISES,
} from "@/lib/donnees/pays";

describe("Pays", () => {
  it("couvre les 16 pays d'Afrique de l'Ouest", () => {
    expect(AFRIQUE_OUEST).toHaveLength(16);
    const codes = AFRIQUE_OUEST.map((p) => p.code);
    for (const attendu of ["BJ", "SN", "CI", "TG", "BF", "ML", "NE", "NG", "GH"]) {
      expect(codes).toContain(attendu);
    }
  });

  it("aucun code en double entre Afrique de l'Ouest et diaspora", () => {
    const tous = [...AFRIQUE_OUEST, ...DIASPORA].map((p) => p.code);
    expect(new Set(tous).size).toBe(tous.length);
  });

  it("trouve un pays, quelle que soit la casse", () => {
    expect(trouverPays("bj")?.nom).toBe("Bénin");
    expect(trouverPays("BJ")?.nom).toBe("Bénin");
    expect(trouverPays("ZZ")).toBeNull();
    expect(trouverPays(null)).toBeNull();
  });

  it("refuse un pays non couvert", () => {
    expect(estPaysAutorise("BJ")).toBe(true);
    expect(estPaysAutorise("FR")).toBe(true); // diaspora
    expect(estPaysAutorise("CN")).toBe(false);
    expect(estPaysAutorise("")).toBe(false);
  });

  it("distingue l'Afrique de l'Ouest de la diaspora", () => {
    expect(estAfriqueOuest("SN")).toBe(true);
    expect(estAfriqueOuest("FR")).toBe(false);
    expect(estAfriqueOuest(null)).toBe(false);
  });

  it("donne le bon fuseau horaire, Cotonou par défaut", () => {
    expect(fuseauDuPays("SN")).toBe("Africa/Dakar");
    expect(fuseauDuPays("CI")).toBe("Africa/Abidjan");
    expect(fuseauDuPays("ZZ")).toBe("Africa/Porto-Novo");
  });

  it("chaque pays a un indicatif et un fuseau", () => {
    for (const p of [...AFRIQUE_OUEST, ...DIASPORA]) {
      expect(p.indicatif).toMatch(/^\+\d+$/);
      expect(p.fuseau).toContain("/");
      expect(p.nom.length).toBeGreaterThan(2);
    }
  });

  it("CODES_AUTORISES contient tous les pays", () => {
    expect(CODES_AUTORISES).toHaveLength(
      AFRIQUE_OUEST.length + DIASPORA.length,
    );
  });
});
