import { describe, it, expect } from "vitest";

/**
 * Vérifie que la liste des préfixes protégés du proxy correspond à
 * ce que le module 01 doit garantir. Si cette liste change, ce test échoue
 * et oblige à mettre à jour la documentation.
 */
describe("Préfixes protégés du proxy", () => {
  it("couvre les 7 espaces de l'app", async () => {
    const source = await import("node:fs").then((fs) =>
      fs.promises.readFile(new URL("../src/proxy.ts", import.meta.url), "utf8"),
    );

    const attendus = [
      "/tableau-de-bord",
      "/demarrage",
      "/campagnes",
      "/prospects",
      "/messagerie",
      "/credits",
      "/parametres",
    ];
    for (const prefix of attendus) {
      expect(source).toContain(`"${prefix}"`);
    }
  });

  it("laisse passer /api/webhooks (via le matcher)", async () => {
    const source = await import("node:fs").then((fs) =>
      fs.promises.readFile(new URL("../src/proxy.ts", import.meta.url), "utf8"),
    );
    expect(source).toContain("api/webhooks");
  });
});
