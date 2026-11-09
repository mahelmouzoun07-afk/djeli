import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";

/**
 * Vérifie que l'absence d'une variable d'environnement donne un message
 * d'erreur clair en français (critère d'acceptation du module 01).
 *
 * `env.ts` et `env-public.ts` mettent leur résultat en cache : il faut
 * réinitialiser le registre des modules à chaque test, sinon le cache d'un
 * autre fichier de test fausse le résultat.
 */
describe("Variables d'environnement : messages d'erreur en français", () => {
  let avant: NodeJS.ProcessEnv;

  beforeEach(() => {
    vi.resetModules();
    avant = { ...process.env };
    // Recrée l'état « pas de .env.local »
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => {
    process.env = avant;
    vi.resetModules();
  });

  it("exigerEnvPublic renvoie un message en français quand la variable manque", async () => {
    const { exigerEnvPublic } = await import("@/lib/env-public");
    expect(() => exigerEnvPublic("NEXT_PUBLIC_SUPABASE_URL")).toThrow(
      /requise.*\.env\.local/i,
    );
  });

  it("exigerEnv renvoie un message en français quand la variable manque", async () => {
    const { exigerEnv } = await import("@/lib/env");
    expect(() => exigerEnv("SUPABASE_SERVICE_ROLE_KEY")).toThrow(
      /requise.*\.env\.local/i,
    );
  });
});
