import { describe, it, expect, afterEach, beforeEach } from "vitest";

/**
 * Vérifie que l'absence d'une variable d'environnement donne un message
 * d'erreur clair en français (critère d'acceptation du module 01).
 */
describe("Variables d'environnement : messages d'erreur en français", () => {
  let avant: NodeJS.ProcessEnv;

  beforeEach(() => {
    avant = { ...process.env };
    // On vide complètement les clés pour recréer l'état "sans .env.local"
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => {
    process.env = avant;
  });

  it("exigerEnvPublic renvoie un message en français quand la variable manque", async () => {
    // Import dynamique car env-public.ts met le résultat en cache
    const mod = await import(
      "@/lib/env-public?t=" + Date.now()
    );
    expect(() => mod.exigerEnvPublic("NEXT_PUBLIC_SUPABASE_URL")).toThrow(
      /requise.*\.env\.local/i,
    );
  });

  it("exigerEnv renvoie un message en français quand la variable manque", async () => {
    const mod = await import("@/lib/env?t=" + Date.now());
    expect(() => mod.exigerEnv("SUPABASE_SERVICE_ROLE_KEY")).toThrow(
      /requise.*\.env\.local/i,
    );
  });
});
