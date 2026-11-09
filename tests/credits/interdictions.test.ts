import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Critère d'acceptation : aucun endroit du code ne doit modifier
 * `soldes_credits` autrement que par les fonctions SQL `crediter`,
 * `debiter`, `rembourser`, `expirer_credits`.
 *
 * On scanne les fichiers TypeScript et on vérifie qu'ils n'écrivent pas
 * directement dans la table `soldes_credits` (en dehors des drapeaux
 * d'alerte, autorisés sur alertes.ts).
 */

const racine = fileURLToPath(new URL("../../", import.meta.url));

/** Autorisé : UPDATE sur les drapeaux (jamais sur la colonne `solde`). */
const AUTORISES = new Set<string>([
  "src/lib/credits/alertes.ts",
]);

function listerFichiersTs(dossier: string): string[] {
  const resultats: string[] = [];
  const entrees = readdirSync(dossier);
  for (const e of entrees) {
    const chemin = join(dossier, e);
    const stat = statSync(chemin);
    if (stat.isDirectory()) {
      if (e === "node_modules" || e === ".next") continue;
      resultats.push(...listerFichiersTs(chemin));
    } else if (e.endsWith(".ts") || e.endsWith(".tsx")) {
      resultats.push(chemin);
    }
  }
  return resultats;
}

describe("Interdiction d'écrire sur soldes_credits hors du service", () => {
  it("aucun UPDATE ou INSERT direct de la colonne `solde`", () => {
    const fichiers = listerFichiersTs(join(racine, "src"));
    const violations: string[] = [];

    const motif =
      /\.from\(\s*["']soldes_credits["']\s*\)[\s\S]{0,200}\.(update|insert|upsert|delete)\s*\(/;

    for (const f of fichiers) {
      const rel = relative(racine, f).replaceAll("\\", "/");
      if (AUTORISES.has(rel)) continue;
      const contenu = readFileSync(f, "utf8");
      if (motif.test(contenu)) {
        violations.push(rel);
      }
    }

    expect(violations).toEqual([]);
  });

  it("alertes.ts : jamais d'update sur la colonne `solde`", () => {
    const chemin = join(racine, "src/lib/credits/alertes.ts");
    const contenu = readFileSync(chemin, "utf8");
    // L'update autorisé touche uniquement les drapeaux d'alerte.
    // On vérifie qu'aucune ligne ne nomme `solde:` dans un objet passé à update().
    const motifInterdit = /\.update\(\s*\{[^}]*\bsolde\s*:/;
    expect(motifInterdit.test(contenu)).toBe(false);
  });
});
