import { NextResponse, type NextRequest } from "next/server";
import { rafraichirSessionSupabase } from "@/lib/supabase/proxy";

/**
 * Proxy Next.js 16 (ex-middleware).
 *
 * Deux rôles :
 * 1. Rafraîchir la session Supabase à chaque requête (sans quoi la session
 *    se perd silencieusement : voir la doc officielle de @supabase/ssr).
 * 2. Rediriger vers /connexion toute visite non authentifiée sur les routes
 *    de l'espace client.
 */
export async function proxy(requete: NextRequest) {
  const { reponse, utilisateur } = await rafraichirSessionSupabase(requete);

  const chemin = requete.nextUrl.pathname;

  if (!utilisateur && estCheminProtege(chemin)) {
    const vers = requete.nextUrl.clone();
    vers.pathname = "/connexion";
    // Pour revenir sur la page demandée après la connexion.
    vers.searchParams.set("retour", chemin);
    return NextResponse.redirect(vers);
  }

  return reponse;
}

/** Routes de l'espace client qui exigent une session. */
const PREFIXES_PROTEGES = [
  "/tableau-de-bord",
  "/demarrage",
  "/campagnes",
  "/prospects",
  "/messagerie",
  "/credits",
  "/parametres",
];

function estCheminProtege(chemin: string): boolean {
  return PREFIXES_PROTEGES.some(
    (p) => chemin === p || chemin.startsWith(p + "/"),
  );
}

/**
 * Le proxy tourne sur toutes les requêtes utiles, mais pas sur :
 * - les fichiers statiques Next.js (_next/static, _next/image)
 * - les webhooks d'API (ont leur propre vérification de signature)
 * - les ressources du dossier public (favicon.ico, images, etc.)
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api/webhooks|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
