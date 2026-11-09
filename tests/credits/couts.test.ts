import { describe, it, expect } from "vitest";
import { coutAction, creditsEnFcfa } from "@/lib/credits/couts";

describe("coutAction", () => {
  it("renvoie le coût fixe des actions courantes", () => {
    expect(coutAction("analyse_prospect")).toBe(4);
    expect(coutAction("email")).toBe(2);
    expect(coutAction("whatsapp_message")).toBe(6);
    expect(coutAction("sms")).toBe(6);
  });

  it("appel : 15 crédits par minute commencée", () => {
    expect(coutAction("appel", { minutes: 1 })).toBe(15);
    expect(coutAction("appel", { minutes: 1.1 })).toBe(30); // arrondi sup
    expect(coutAction("appel", { minutes: 3 })).toBe(45);
    expect(coutAction("appel")).toBe(15); // défaut 1 minute
  });

  it("creditsEnFcfa : 1 crédit = 10 FCFA", () => {
    expect(creditsEnFcfa(0)).toBe(0);
    expect(creditsEnFcfa(1)).toBe(10);
    expect(creditsEnFcfa(22)).toBe(220);
    expect(creditsEnFcfa(1_050)).toBe(10_500);
  });
});
