import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Vérifie que admin.ts est protégé par "server-only".
 *
 * Importer un module avec "server-only" depuis un fichier "use client"
 * fait échouer le build Next.js, ce qui garantit que la clé service_role
 * ne peut jamais finir dans le bundle du navigateur.
 */
describe("Supabase admin : interdit côté client", () => {
  it("admin.ts importe 'server-only'", () => {
    const source = readFileSync(
      new URL("../src/lib/supabase/admin.ts", import.meta.url),
      "utf8",
    );
    expect(source).toMatch(/import\s+["']server-only["']/);
  });

  it("env.ts importe 'server-only' (car il expose la clé service_role)", () => {
    const source = readFileSync(
      new URL("../src/lib/env.ts", import.meta.url),
      "utf8",
    );
    expect(source).toMatch(/import\s+["']server-only["']/);
  });

  it("proxy côté serveur importe 'server-only'", () => {
    const source = readFileSync(
      new URL("../src/lib/supabase/proxy.ts", import.meta.url),
      "utf8",
    );
    expect(source).toMatch(/import\s+["']server-only["']/);
  });

  it("server.ts importe 'server-only'", () => {
    const source = readFileSync(
      new URL("../src/lib/supabase/server.ts", import.meta.url),
      "utf8",
    );
    expect(source).toMatch(/import\s+["']server-only["']/);
  });

  it("client.ts n'importe PAS 'server-only' (il tourne dans le navigateur)", () => {
    const source = readFileSync(
      new URL("../src/lib/supabase/client.ts", import.meta.url),
      "utf8",
    );
    expect(source).not.toMatch(/import\s+["']server-only["']/);
    expect(source).toMatch(/["']use client["']/);
  });
});
