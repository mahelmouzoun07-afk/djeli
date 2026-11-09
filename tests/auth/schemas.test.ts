import { describe, it, expect } from "vitest";
import {
  schemaInscription,
  schemaConnexion,
  schemaChangerMotDePasse,
  schemaCreerEntreprise,
  premierMessage,
} from "@/lib/auth/schemas";

const inscriptionValide = {
  email: "Koffi@Example.COM",
  motDePasse: "motdepasse123",
  nomComplet: "Koffi Agbodjan",
  nomEntreprise: "Studio Koffi",
  pays: "bj",
  telephone: "+2290197000000",
};

describe("schemaInscription", () => {
  it("accepte une inscription complète et normalise email et pays", () => {
    const r = schemaInscription.safeParse(inscriptionValide);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBe("koffi@example.com");
      expect(r.data.pays).toBe("BJ");
    }
  });

  it("accepte une inscription sans téléphone", () => {
    const sansTel = { ...inscriptionValide };
    delete (sansTel as { telephone?: string }).telephone;
    expect(schemaInscription.safeParse(sansTel).success).toBe(true);
    expect(
      schemaInscription.safeParse({ ...sansTel, telephone: "" }).success,
    ).toBe(true);
  });

  it("refuse un mot de passe de moins de 8 caractères", () => {
    const r = schemaInscription.safeParse({
      ...inscriptionValide,
      motDePasse: "court",
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(premierMessage(r.error)).toMatch(/8 caractères/);
  });

  it("refuse un email invalide", () => {
    const r = schemaInscription.safeParse({
      ...inscriptionValide,
      email: "pas-un-email",
    });
    expect(r.success).toBe(false);
  });

  it("refuse un pays non couvert", () => {
    const r = schemaInscription.safeParse({
      ...inscriptionValide,
      pays: "CN",
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(premierMessage(r.error)).toMatch(/pays/i);
  });

  it("refuse un téléphone qui ne correspond pas au pays", () => {
    const r = schemaInscription.safeParse({
      ...inscriptionValide,
      telephone: "12",
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(premierMessage(r.error)).toMatch(/téléphone/i);
  });

  it("refuse un nom d'entreprise vide", () => {
    const r = schemaInscription.safeParse({
      ...inscriptionValide,
      nomEntreprise: " ",
    });
    expect(r.success).toBe(false);
  });
});

describe("schemaConnexion", () => {
  it("accepte email et mot de passe", () => {
    const r = schemaConnexion.safeParse({
      email: "a@b.com",
      motDePasse: "x",
    });
    expect(r.success).toBe(true);
  });

  it("n'impose pas 8 caractères à la connexion (comptes anciens)", () => {
    // Un mot de passe existant peut être plus court : seule l'inscription
    // impose la longueur. Sinon un ancien client ne pourrait plus se connecter.
    const r = schemaConnexion.safeParse({ email: "a@b.com", motDePasse: "abc" });
    expect(r.success).toBe(true);
  });
});

describe("schemaChangerMotDePasse", () => {
  it("accepte deux mots de passe identiques", () => {
    const r = schemaChangerMotDePasse.safeParse({
      nouveau: "nouveaumotdepasse",
      confirmation: "nouveaumotdepasse",
    });
    expect(r.success).toBe(true);
  });

  it("refuse deux mots de passe différents", () => {
    const r = schemaChangerMotDePasse.safeParse({
      nouveau: "nouveaumotdepasse",
      confirmation: "autremotdepasse",
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(premierMessage(r.error)).toMatch(/identiques/);
  });
});

describe("schemaCreerEntreprise", () => {
  it("accepte nom et pays", () => {
    const r = schemaCreerEntreprise.safeParse({
      nomEntreprise: "Studio Koffi",
      pays: "SN",
    });
    expect(r.success).toBe(true);
  });

  it("refuse un pays inconnu", () => {
    const r = schemaCreerEntreprise.safeParse({
      nomEntreprise: "Studio Koffi",
      pays: "XX",
    });
    expect(r.success).toBe(false);
  });
});
