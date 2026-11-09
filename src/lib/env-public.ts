import { z } from "zod";

/**
 * Variables d'environnement PUBLIQUES, préfixées par NEXT_PUBLIC_.
 * Celles-ci sont intégrées au bundle du navigateur : ne jamais y mettre de
 * secret. Elles sont lues ici pour être validées à la compilation.
 */
const schemaPublic = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL doit être une URL complète")
    .optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

type EnvPublic = z.infer<typeof schemaPublic>;

let cache: EnvPublic | null = null;

export function envPublic(): EnvPublic {
  if (cache) return cache;

  // Next.js inline les NEXT_PUBLIC_* à la compilation :
  // on ne peut pas les lire avec process.env[cle] dynamique côté navigateur.
  const brut = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  const resultat = schemaPublic.safeParse(brut);

  if (!resultat.success) {
    const problemes = resultat.error.issues
      .map((p) => `  - ${p.path.join(".") || "variable"} : ${p.message}`)
      .join("\n");
    throw new Error(
      `Les variables d'environnement publiques sont invalides :\n${problemes}\n\n` +
        `Copie .env.example vers .env.local et renseigne les valeurs manquantes.`,
    );
  }

  cache = resultat.data;
  return cache;
}

export function exigerEnvPublic<K extends keyof EnvPublic>(
  cle: K,
): NonNullable<EnvPublic[K]> {
  const valeur = envPublic()[cle];
  if (valeur === undefined || valeur === null || valeur === "") {
    throw new Error(
      `La variable d'environnement publique "${cle}" est requise. ` +
        `Ajoute-la dans .env.local (voir .env.example).`,
    );
  }
  return valeur as NonNullable<EnvPublic[K]>;
}
