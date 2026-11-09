/**
 * Tests du moteur de crédits contre une vraie base Supabase.
 * Sautés si TEST_SUPABASE_* ne sont pas définis (voir tests/db/README.md).
 *
 * Ce sont les tests obligatoires du module 03 : concurrence, idempotence,
 * remboursement, plafond journalier, expiration.
 */
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  configTestOuNull,
  clientAdmin,
  creerUtilisateurEtClient,
  creerEntrepriseAvecProprietaire,
} from "./helpers";

const config = configTestOuNull();
const describeSiDb = config ? describe : describe.skip;

interface ResultatDebitSql {
  ok: boolean;
  solde: number;
  raison: string;
}

describeSiDb("Moteur de crédits (SQL)", () => {
  let admin: SupabaseClient;
  let entrepriseId: string;
  let campagneId: string;

  beforeAll(async () => {
    if (!config) return;
    admin = clientAdmin(config);
    await admin.from("entreprises").delete().ilike("nom", "test-credits-%");

    const u = await creerUtilisateurEtClient(config, "credits-user@djeli.test");
    entrepriseId = await creerEntrepriseAvecProprietaire(
      admin,
      u.userId,
      "test-credits-a",
    );

    const { data: camp } = await admin
      .from("campagnes")
      .insert({
        entreprise_id: entrepriseId,
        nom: "campagne crédits",
        plafond_credits_jour: 20,
      })
      .select("id")
      .single();
    campagneId = camp!.id as string;
  }, 30_000);

  beforeEach(async () => {
    if (!config) return;
    // Remise à zéro entre les tests
    await admin.from("transactions_credits").delete().eq("entreprise_id", entrepriseId);
    await admin.from("depenses_jour").delete().eq("entreprise_id", entrepriseId);
    await admin
      .from("soldes_credits")
      .upsert(
        { entreprise_id: entrepriseId, solde: 0, reference_alerte: null },
        { onConflict: "entreprise_id" },
      );
  });

  it("100 débits simultanés de 6 crédits sur 300 : exactement 50 réussissent, solde final 0", async () => {
    await admin.rpc("crediter", {
      entreprise: entrepriseId,
      montant: 300,
      type_tx: "achat",
      motif: "test concurrence",
      reference: null,
      cle: "concurrence:achat",
      expire_le: null,
    });

    // 100 débits de 6 crédits, en parallèle, sans plafond de campagne
    const appels = Array.from({ length: 100 }, (_, i) =>
      admin.rpc("debiter", {
        entreprise: entrepriseId,
        montant: 6,
        motif: "test concurrence",
        reference: null,
        cle: `concurrence:debit:${i}`,
        campagne: null,
        canal_debit: null,
      }),
    );

    const reponses = await Promise.all(appels);
    const reussis = reponses.filter(
      (r) => (r.data as ResultatDebitSql | null)?.ok === true,
    ).length;

    expect(reussis).toBe(50);

    const { data: solde } = await admin
      .from("soldes_credits")
      .select("solde")
      .eq("entreprise_id", entrepriseId)
      .single<{ solde: number }>();
    expect(solde!.solde).toBe(0);
  }, 60_000);

  it("un débit rejoué avec la même clé ne débite qu'une fois", async () => {
    await admin.rpc("crediter", {
      entreprise: entrepriseId,
      montant: 100,
      type_tx: "achat",
      motif: "test idempotence",
      reference: null,
      cle: "idem:achat",
      expire_le: null,
    });

    const params = {
      entreprise: entrepriseId,
      montant: 6,
      motif: "envoi whatsapp",
      reference: null,
      cle: "idem:debit:1",
      campagne: null,
      canal_debit: null,
    };

    const r1 = await admin.rpc("debiter", params);
    const r2 = await admin.rpc("debiter", params);
    const r3 = await admin.rpc("debiter", params);

    expect((r1.data as ResultatDebitSql).ok).toBe(true);
    expect((r2.data as ResultatDebitSql).raison).toBe("deja_debite");
    expect((r3.data as ResultatDebitSql).raison).toBe("deja_debite");

    const { data: solde } = await admin
      .from("soldes_credits")
      .select("solde")
      .eq("entreprise_id", entrepriseId)
      .single<{ solde: number }>();
    expect(solde!.solde).toBe(94); // 100 - 6, une seule fois
  });

  it("un remboursement rejoué ne recrédite qu'une fois", async () => {
    await admin.rpc("crediter", {
      entreprise: entrepriseId,
      montant: 100,
      type_tx: "achat",
      motif: "test remboursement",
      reference: null,
      cle: "remb:achat",
      expire_le: null,
    });
    await admin.rpc("debiter", {
      entreprise: entrepriseId,
      montant: 6,
      motif: "envoi",
      reference: null,
      cle: "remb:debit:1",
      campagne: null,
      canal_debit: null,
    });

    await admin.rpc("rembourser", { cle_debit: "remb:debit:1", motif: "non livré" });
    await admin.rpc("rembourser", { cle_debit: "remb:debit:1", motif: "non livré" });
    await admin.rpc("rembourser", { cle_debit: "remb:debit:1", motif: "non livré" });

    const { data: solde } = await admin
      .from("soldes_credits")
      .select("solde")
      .eq("entreprise_id", entrepriseId)
      .single<{ solde: number }>();
    expect(solde!.solde).toBe(100); // 100 - 6 + 6, une seule fois
  });

  it("le plafond du jour bloque le débit qui le dépasserait", async () => {
    await admin.rpc("crediter", {
      entreprise: entrepriseId,
      montant: 1000,
      type_tx: "achat",
      motif: "test plafond",
      reference: null,
      cle: "plafond:achat",
      expire_le: null,
    });

    // La campagne a un plafond de 20 crédits par jour.
    // 3 débits de 6 passent (18), le 4ᵉ dépasserait (24) → refusé.
    for (let i = 0; i < 3; i++) {
      const r = await admin.rpc("debiter", {
        entreprise: entrepriseId,
        montant: 6,
        motif: "envoi whatsapp",
        reference: null,
        cle: `plafond:debit:${i}`,
        campagne: campagneId,
        canal_debit: "whatsapp",
      });
      expect((r.data as ResultatDebitSql).ok).toBe(true);
    }

    const r4 = await admin.rpc("debiter", {
      entreprise: entrepriseId,
      montant: 6,
      motif: "envoi whatsapp",
      reference: null,
      cle: "plafond:debit:3",
      campagne: campagneId,
      canal_debit: "whatsapp",
    });
    const res = r4.data as ResultatDebitSql;
    expect(res.ok).toBe(false);
    expect(res.raison).toBe("plafond_jour");
  });

  it("l'expiration ne touche que les crédits de plus de 12 mois", async () => {
    const dansUnAn = new Date();
    dansUnAn.setMonth(dansUnAn.getMonth() + 12);
    const hier = new Date();
    hier.setDate(hier.getDate() - 1);

    // 100 crédits encore valides
    await admin.rpc("crediter", {
      entreprise: entrepriseId,
      montant: 100,
      type_tx: "achat",
      motif: "achat récent",
      reference: null,
      cle: "exp:recent",
      expire_le: dansUnAn.toISOString(),
    });
    // 50 crédits expirés hier
    await admin.rpc("crediter", {
      entreprise: entrepriseId,
      montant: 50,
      type_tx: "achat",
      motif: "achat ancien",
      reference: null,
      cle: "exp:ancien",
      expire_le: hier.toISOString(),
    });

    await admin.rpc("expirer_credits", {});

    const { data: solde } = await admin
      .from("soldes_credits")
      .select("solde")
      .eq("entreprise_id", entrepriseId)
      .single<{ solde: number }>();
    // 150 - 50 expirés = 100
    expect(solde!.solde).toBe(100);

    const { data: txs } = await admin
      .from("transactions_credits")
      .select("type, montant")
      .eq("entreprise_id", entrepriseId)
      .eq("type", "expiration");
    expect(txs).toHaveLength(1);
    expect((txs![0] as { montant: number }).montant).toBe(-50);
  });

  it("le solde ne peut jamais devenir négatif", async () => {
    await admin.rpc("crediter", {
      entreprise: entrepriseId,
      montant: 5,
      type_tx: "achat",
      motif: "petit solde",
      reference: null,
      cle: "neg:achat",
      expire_le: null,
    });

    const r = await admin.rpc("debiter", {
      entreprise: entrepriseId,
      montant: 6,
      motif: "trop cher",
      reference: null,
      cle: "neg:debit",
      campagne: null,
      canal_debit: null,
    });
    const res = r.data as ResultatDebitSql;
    expect(res.ok).toBe(false);
    expect(res.raison).toBe("solde_insuffisant");
    expect(res.solde).toBe(5);
  });
});
