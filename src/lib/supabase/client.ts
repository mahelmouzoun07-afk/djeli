"use client";

import { createBrowserClient } from "@supabase/ssr";
import { exigerEnvPublic } from "../env-public";
import type { Database } from "./database.types";

/**
 * Client Supabase pour un composant client ("use client").
 * Les cookies sont gérés automatiquement par @supabase/ssr.
 */
export function creerClientNavigateur() {
  return createBrowserClient<Database>(
    exigerEnvPublic("NEXT_PUBLIC_SUPABASE_URL"),
    exigerEnvPublic("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}
