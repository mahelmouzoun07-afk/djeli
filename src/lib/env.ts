import "server-only";
import { z } from "zod";

/**
 * Variables d'environnement côté SERVEUR.
 * Ne jamais importer ce fichier depuis un composant client.
 *
 * Les clés marquées `.optional()` deviendront obligatoires dans le module qui
 * les utilise. Chaque module ajoute sa propre vérification au démarrage.
 */
const schemaServeur = z.object({
  // Supabase (clé service_role — JAMAIS exposée au navigateur)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Claude (Anthropic)
  ANTHROPIC_API_KEY: z.string().min(1).optional(),

  // Resend (emails transactionnels)
  RESEND_API_KEY: z.string().min(1).optional(),

  // Groq (transcription Whisper)
  GROQ_API_KEY: z.string().min(1).optional(),

  // Trigger.dev
  TRIGGER_SECRET_KEY: z.string().min(1).optional(),

  // URL publique de l'application (sans barre finale)
  APP_URL: z
    .string()
    .url("APP_URL doit être une URL complète, par exemple http://localhost:3000")
    .optional(),

  // Sel du hachage des IP (limite de fréquence, module 04)
  SEL_EMPREINTE_IP: z.string().min(8).optional(),

  // Niveau de journalisation : debug, info, warn, error
  NIVEAU_JOURNAL: z.enum(["debug", "info", "warn", "error"]).optional(),

  // Environnement d'exécution
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

type EnvServeur = z.infer<typeof schemaServeur>;

let cache: EnvServeur | null = null;

/**
 * Lit et valide les variables d'environnement du serveur.
 * En cas d'erreur, affiche un message clair en français et jette.
 */
export function env(): EnvServeur {
  if (cache) return cache;

  const resultat = schemaServeur.safeParse(process.env);

  if (!resultat.success) {
    const problemes = resultat.error.issues
      .map((p) => `  - ${p.path.join(".") || "variable"} : ${p.message}`)
      .join("\n");
    throw new Error(
      `Les variables d'environnement du serveur sont invalides :\n${problemes}\n\n` +
        `Copie .env.example vers .env.local et renseigne les valeurs manquantes.`,
    );
  }

  cache = resultat.data;
  return cache;
}

/**
 * Rend une variable obligatoire. À appeler depuis le module qui en a besoin.
 * Exemple : exigerEnv("ANTHROPIC_API_KEY") au démarrage du module d'analyse.
 */
export function exigerEnv<K extends keyof EnvServeur>(cle: K): NonNullable<EnvServeur[K]> {
  const valeur = env()[cle];
  if (valeur === undefined || valeur === null || valeur === "") {
    throw new Error(
      `La variable d'environnement "${cle}" est requise pour cette fonctionnalité. ` +
        `Ajoute-la dans .env.local (voir .env.example).`,
    );
  }
  return valeur as NonNullable<EnvServeur[K]>;
}
