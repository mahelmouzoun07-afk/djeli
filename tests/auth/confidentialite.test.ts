import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Critère d'acceptation : aucun message d'erreur ne doit révéler si une
 * adresse email est déjà inscrite. On vérifie par lecture du code des
 * Server Actions, car ces chemins dépendent de Supabase Auth et ne sont pas
 * testables sans instance.
 */

const actions = readFileSync(
  fileURLToPath(new URL("../../src/app/(auth)/actions.ts", import.meta.url)),
  "utf8",
);

describe("Confidentialité des comptes", () => {
  it("l'inscription ne dit pas qu'un email existe déjà", () => {
    // Le cas user_already_exists doit renvoyer un succès, pas une erreur.
    expect(actions).toMatch(/user_already_exists/);
    const extrait = actions.slice(
      actions.indexOf("user_already_exists"),
      actions.indexOf("user_already_exists") + 200,
    );
    expect(extrait).toMatch(/succes\(/);
    expect(extrait).not.toMatch(/existe déjà|déjà inscrit|already registered/i);
  });

  it("la connexion donne le même message pour email inconnu et mot de passe faux", () => {
    expect(actions).toMatch(/Adresse email ou mot de passe incorrect/);
    // Un seul message d'échec possible sur ce chemin.
    const occurrences = actions.match(/identifiants_invalides/g) ?? [];
    expect(occurrences.length).toBe(1);
  });

  it("le lien magique répond toujours la même chose", () => {
    expect(actions).toMatch(/MESSAGE_NEUTRE/);
    expect(actions).toMatch(/Si ce compte existe/);
  });

  it("le mot de passe oublié répond toujours la même chose", () => {
    const debut = actions.indexOf("export async function motDePasseOublie");
    const fin = actions.indexOf("export async function changerMotDePasse");
    const bloc = actions.slice(debut, fin);
    expect(bloc).toMatch(/MESSAGE_NEUTRE/);
    // Aucun retour d'échec lié à l'existence du compte dans ce bloc.
    expect(bloc).not.toMatch(/compte introuvable|utilisateur inconnu/i);
  });

  it("les erreurs Supabase sont journalisées sans fuiter vers le client", () => {
    // On journalise un code, jamais le message brut dans la réponse.
    expect(actions).toMatch(/log\.warn\("connexion\.echec"/);
    expect(actions).not.toMatch(/erreur:\s*error\.message\s*\}\s*\)\s*;?\s*return echec\(error\.message/);
  });
});

describe("Sécurité de la route de callback", () => {
  const callback = readFileSync(
    fileURLToPath(new URL("../../src/app/auth/callback/route.ts", import.meta.url)),
    "utf8",
  );

  it("refuse une redirection vers un autre site", () => {
    expect(callback).toMatch(/cheminInterne/);
    // Le garde-fou : doit commencer par / mais pas par //
    expect(callback).toMatch(/startsWith\("\/\/"\)/);
  });
});
