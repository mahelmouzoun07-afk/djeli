/**
 * Tests RLS : 4 scénarios obligatoires du module 02.
 *
 * Skipped si Supabase local n'est pas disponible : exporter
 * TEST_SUPABASE_URL / _ANON_KEY / _SERVICE_ROLE_KEY avant `npm test`.
 */
import { describe, it, expect, beforeAll } from "vitest";
import {
  configTestOuNull,
  clientAdmin,
  clientAnon,
  creerUtilisateurEtClient,
  creerEntrepriseAvecProprietaire,
} from "./helpers";

const config = configTestOuNull();
const describeSiDb = config ? describe : describe.skip;

describeSiDb("RLS : isolation entre entreprises", () => {
  let entrepriseA: string;
  let entrepriseB: string;
  let clientA: Awaited<ReturnType<typeof creerUtilisateurEtClient>>["client"];

  beforeAll(async () => {
    if (!config) return;
    const admin = clientAdmin(config);

    // Nettoyage des entreprises de test (évite les résidus entre runs).
    await admin.from("entreprises").delete().ilike("nom", "test-rls-%");

    const a = await creerUtilisateurEtClient(
      config,
      "rls-user-a@djeli.test",
    );
    const b = await creerUtilisateurEtClient(
      config,
      "rls-user-b@djeli.test",
    );

    entrepriseA = await creerEntrepriseAvecProprietaire(
      admin,
      a.userId,
      "test-rls-a",
    );
    entrepriseB = await creerEntrepriseAvecProprietaire(
      admin,
      b.userId,
      "test-rls-b",
    );

    // Une campagne dans chaque entreprise, puis un prospect dans chaque campagne.
    const { data: campA } = await admin
      .from("campagnes")
      .insert({ entreprise_id: entrepriseA, nom: "campagne A" })
      .select("id")
      .single();
    const { data: campB } = await admin
      .from("campagnes")
      .insert({ entreprise_id: entrepriseB, nom: "campagne B" })
      .select("id")
      .single();

    await admin.from("prospects").insert([
      {
        entreprise_id: entrepriseA,
        campagne_id: campA!.id,
        nom_entreprise: "prospect-A",
      },
      {
        entreprise_id: entrepriseB,
        campagne_id: campB!.id,
        nom_entreprise: "prospect-B",
      },
    ]);

    clientA = a.client;
  }, 30_000);

  it("l'utilisateur A ne voit pas les prospects de l'entreprise B", async () => {
    const { data, error } = await clientA.from("prospects").select("nom_entreprise");
    expect(error).toBeNull();
    const noms = (data ?? []).map((p: { nom_entreprise: string }) => p.nom_entreprise);
    expect(noms).toContain("prospect-A");
    expect(noms).not.toContain("prospect-B");
  });

  it("A ne peut pas écrire dans transactions_credits", async () => {
    const { error } = await clientA.from("transactions_credits").insert({
      entreprise_id: entrepriseA,
      type: "achat",
      montant: 100,
      solde_apres: 100,
    });
    expect(error).not.toBeNull();
  });

  it("un utilisateur connecté ne peut lire ni opt_outs ni boites_envoi", async () => {
    const r1 = await clientA.from("opt_outs").select("id");
    const r2 = await clientA.from("boites_envoi").select("id");
    expect(r1.data ?? []).toEqual([]);
    expect(r2.data ?? []).toEqual([]);
    // Les deux politiques manquantes font renvoyer un tableau vide
    // (comportement standard de la RLS), sans erreur.
  });

  it("solde ne peut pas devenir négatif (contrainte CHECK)", async () => {
    if (!config) return;
    const admin = clientAdmin(config);
    const { error } = await admin
      .from("soldes_credits")
      .insert({ entreprise_id: entrepriseA, solde: -1 });
    expect(error).not.toBeNull();
    expect(error!.message.toLowerCase()).toMatch(/check|contrainte|solde_positif/);
  });

  it("anon : aucune lecture possible des entreprises", async () => {
    if (!config) return;
    const anon = clientAnon(config);
    const { data } = await anon.from("entreprises").select("id");
    expect(data ?? []).toEqual([]);
  });
});
