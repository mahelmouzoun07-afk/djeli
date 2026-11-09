import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { journal } from "@/lib/journal";

describe("journal", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let niveauAvant: string | undefined;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    niveauAvant = process.env.NIVEAU_JOURNAL;
    process.env.NIVEAU_JOURNAL = "debug";
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    if (niveauAvant === undefined) {
      delete process.env.NIVEAU_JOURNAL;
    } else {
      process.env.NIVEAU_JOURNAL = niveauAvant;
    }
  });

  it("écrit une ligne JSON avec horodatage, niveau et message", () => {
    journal("info", "Test", { cle: "valeur" });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const ligne = logSpy.mock.calls[0]![0] as string;
    const objet = JSON.parse(ligne);
    expect(objet.niveau).toBe("info");
    expect(objet.message).toBe("Test");
    expect(objet.contexte).toEqual({ cle: "valeur" });
    expect(typeof objet.horodatage).toBe("string");
  });

  it("utilise console.error pour le niveau error", () => {
    journal("error", "Catastrophe");
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("respecte le seuil NIVEAU_JOURNAL", () => {
    process.env.NIVEAU_JOURNAL = "warn";
    journal("debug", "On ne me voit pas");
    journal("info", "Moi non plus");
    journal("warn", "Moi oui");
    expect(logSpy).not.toHaveBeenCalled();
    // warn passe par console.warn → spy séparé non défini ici, mais la ligne est
    // écrite malgré tout. On vérifie seulement que debug/info sont tus.
  });
});
