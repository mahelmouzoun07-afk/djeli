import "server-only";
import { createClient } from "@supabase/supabase-js";
import { exigerEnv } from "../env";
import { exigerEnvPublic } from "../env-public";
import type { Database } from "./database.types";

/**
 * Client Supabase ADMIN : utilise la clé `service_role` et CONTOURNE la RLS.
 *
 * À utiliser uniquement :
 * - dans les tâches de fond (Trigger.dev, src/trigger/*)
 * - dans les webhooks (src/app/api/webhooks/*)
 * - dans les scripts administratifs (scripts/*)
 *
 * NE JAMAIS importer depuis un fichier "use client" ni depuis un composant
 * client : l'import de "server-only" fait échouer le build dans ce cas.
 */
export function creerClientAdmin() {
  return createClient<Database>(
    exigerEnvPublic("NEXT_PUBLIC_SUPABASE_URL"),
    exigerEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
