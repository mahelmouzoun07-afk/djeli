import { describe, it, expect } from "vitest";
import {
  normaliserTelephone,
  estTelephoneValide,
  afficherTelephone,
} from "@/lib/donnees/telephone";

describe("normaliserTelephone", () => {
  it("met un numéro béninois au format E.164", () => {
    // Les mobiles au Bénin font 10 chiffres depuis 2024 (préfixe 01).
    const r = normaliserTelephone("+229 01 97 00 00 00");
    expect(r?.e164).toBe("+2290197000000");
    expect(r?.pays).toBe("BJ");
  });

  it("accepte un numéro sans indicatif si le pays est donné", () => {
    const r = normaliserTelephone("0197000000", "BJ");
    expect(r?.e164).toBe("+2290197000000");
  });

  it("met un numéro sénégalais au format E.164", () => {
    const r = normaliserTelephone("77 123 45 67", "SN");
    expect(r?.e164).toBe("+221771234567");
    expect(r?.pays).toBe("SN");
  });

  it("met un numéro ivoirien au format E.164", () => {
    const r = normaliserTelephone("+225 07 07 12 34 56");
    expect(r?.e164).toBe("+2250707123456");
    expect(r?.pays).toBe("CI");
  });

  it("ignore les espaces, points et tirets", () => {
    const a = normaliserTelephone("77.123.45.67", "SN");
    const b = normaliserTelephone("77-123-45-67", "SN");
    const c = normaliserTelephone("  771234567  ", "SN");
    expect(a?.e164).toBe("+221771234567");
    expect(b?.e164).toBe(a?.e164);
    expect(c?.e164).toBe(a?.e164);
  });

  it("refuse un numéro invalide", () => {
    expect(normaliserTelephone("12", "BJ")).toBeNull();
    expect(normaliserTelephone("pas un numéro", "BJ")).toBeNull();
    expect(normaliserTelephone("", "BJ")).toBeNull();
    expect(normaliserTelephone(null)).toBeNull();
    expect(normaliserTelephone(undefined)).toBeNull();
  });

  it("reconnaît un mobile", () => {
    const r = normaliserTelephone("77 123 45 67", "SN");
    expect(r?.estMobile).toBe(true);
  });

  it("estTelephoneValide reflète la normalisation", () => {
    expect(estTelephoneValide("771234567", "SN")).toBe(true);
    expect(estTelephoneValide("12", "SN")).toBe(false);
    expect(estTelephoneValide(null)).toBe(false);
  });

  it("afficherTelephone rend le numéro lisible", () => {
    const affiche = afficherTelephone("+221771234567");
    expect(affiche).toContain("+221");
    expect(affiche).toContain(" ");
  });

  it("afficherTelephone renvoie l'entrée si elle n'est pas formatable", () => {
    expect(afficherTelephone("pas-un-numero")).toBe("pas-un-numero");
  });
});
