/**
 * Utilitaires pour les tests qui tapent sur la base Supabase locale.
 * Se déclenchent seulement si TEST_SUPABASE_URL est défini.
 *
 * En local : lancer `npm run db:start`, puis exporter :
 *   TEST_SUPABASE_URL=http://127.0.0.1:54321
 *   TEST_SUPABASE_ANON_KEY=...
 *   TEST_SUPABASE_SERVICE_ROLE_KEY=...
 * (Les valeurs sont affichées par `supabase status`.)
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface ConfigTest {
  url: string;
  anonKey: string;
  serviceKey: string;
}

export function configTestOuNull(): ConfigTest | null {
  const url = process.env.TEST_SUPABASE_URL;
  const anon = process.env.TEST_SUPABASE_ANON_KEY;
  const service = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) return null;
  return { url, anonKey: anon, serviceKey: service };
}

export function clientAdmin(c: ConfigTest): SupabaseClient {
  return createClient(c.url, c.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function clientAnon(c: ConfigTest): SupabaseClient {
  return createClient(c.url, c.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Crée un utilisateur confirmé par l'API admin, se connecte, et renvoie un
 * client authentifié en son nom. Utilisé pour les tests RLS.
 */
export async function creerUtilisateurEtClient(
  c: ConfigTest,
  email: string,
  motDePasse = "motdepasse-test-123",
): Promise<{ client: SupabaseClient; userId: string }> {
  const admin = clientAdmin(c);

  // Supprime un éventuel user résiduel (nettoyage entre runs).
  const { data: existants } = await admin.auth.admin.listUsers();
  const existant = existants.users.find((u) => u.email === email);
  if (existant) {
    await admin.auth.admin.deleteUser(existant.id);
  }

  const { data: cree, error: erreurCreation } =
    await admin.auth.admin.createUser({
      email,
      password: motDePasse,
      email_confirm: true,
    });
  if (erreurCreation || !cree.user) {
    throw new Error(
      `Création utilisateur impossible : ${erreurCreation?.message}`,
    );
  }

  const client = createClient(c.url, c.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: erreurConnexion } = await client.auth.signInWithPassword({
    email,
    password: motDePasse,
  });
  if (erreurConnexion) {
    throw new Error(`Connexion impossible : ${erreurConnexion.message}`);
  }

  return { client, userId: cree.user.id };
}

/**
 * Crée une entreprise et rattache le propriétaire indiqué.
 * Appelé avec le client admin (contourne la RLS).
 */
export async function creerEntrepriseAvecProprietaire(
  admin: SupabaseClient,
  profilId: string,
  nom: string,
): Promise<string> {
  const { data: entreprise, error: errE } = await admin
    .from("entreprises")
    .insert({ nom, pays: "BJ" })
    .select("id")
    .single();
  if (errE || !entreprise) {
    throw new Error(`Création entreprise impossible : ${errE?.message}`);
  }
  const { error: errM } = await admin.from("membres").insert({
    entreprise_id: entreprise.id,
    profil_id: profilId,
    role: "proprietaire",
  });
  if (errM) {
    throw new Error(`Rattachement membre impossible : ${errM.message}`);
  }
  return entreprise.id as string;
}
