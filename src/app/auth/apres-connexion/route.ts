import { NextResponse, type NextRequest } from "next/server";
import { entrepriseOuNull } from "@/lib/auth/session";

/**
 * Aiguillage après une connexion réussie.
 *
 * - Pas d'entreprise → on la fait créer
 * - Entreprise sans premier achat → page des crédits
 * - Sinon → tableau de bord
 */
export async function GET(requete: NextRequest) {
  const origine = new URL(requete.url).origin;
  const entreprise = await entrepriseOuNull();

  if (!entreprise) {
    return NextResponse.redirect(new URL("/inscription/entreprise", origine));
  }

  if (!entreprise.premierAchatFait) {
    return NextResponse.redirect(new URL("/credits", origine));
  }

  return NextResponse.redirect(new URL("/tableau-de-bord", origine));
}
