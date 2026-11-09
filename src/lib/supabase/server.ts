import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { exigerEnvPublic } from "../env-public";
import type { Database } from "./database.types";

/**
 * Client Supabase pour un Server Component, une Server Action ou une route.
 *
 * - Respecte la Row Level Security (clé "anon")
 * - Lit et écrit les cookies de session via `next/headers`
 *
 * À appeler une fois par requête ; jamais stocker à la racine d'un module.
 */
export async function creerClientServeur() {
  const url = exigerEnvPublic("NEXT_PUBLIC_SUPABASE_URL");
  const cle = exigerEnvPublic("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const biscuits = await cookies();

  return createServerClient<Database>(url, cle, {
    cookies: {
      getAll() {
        return biscuits.getAll();
      },
      setAll(aEcrire) {
        try {
          for (const { name, value, options } of aEcrire) {
            biscuits.set(name, value, options);
          }
        } catch {
          // Appelé depuis un Server Component (pas de Set-Cookie possible).
          // Le proxy.ts rafraîchit déjà la session, donc on peut ignorer.
        }
      },
    },
  });
}
