import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { exigerEnvPublic } from "../env-public";
import type { Database } from "./database.types";

/**
 * Rafraîchit la session Supabase pour chaque requête.
 *
 * Retourne la réponse à renvoyer (avec les cookies mis à jour). Appelé par
 * src/proxy.ts (le "proxy" Next.js 16, ex-"middleware").
 *
 * Suit le patron officiel de @supabase/ssr : la paire getAll / setAll, qui
 * seule gère correctement le rafraîchissement des jetons.
 */
export async function rafraichirSessionSupabase(requete: NextRequest) {
  // Important : réponse construite depuis la requête, pour conserver les en-têtes.
  let reponse = NextResponse.next({ request: requete });

  const client = createServerClient<Database>(
    exigerEnvPublic("NEXT_PUBLIC_SUPABASE_URL"),
    exigerEnvPublic("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return requete.cookies.getAll();
        },
        setAll(aEcrire) {
          for (const { name, value } of aEcrire) {
            requete.cookies.set(name, value);
          }
          reponse = NextResponse.next({ request: requete });
          for (const { name, value, options } of aEcrire) {
            reponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Rafraîchit le jeton si besoin ; lit l'utilisateur de la session.
  const {
    data: { user },
  } = await client.auth.getUser();

  return { reponse, utilisateur: user };
}
