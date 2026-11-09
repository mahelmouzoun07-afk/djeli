/**
 * Djeli — constantes de marque et configuration
 */

export const brand = {
  name: "djeli",
  domain: "djeliai.com",
  tagline: "Trouvez vos clients pendant que vous dormez.",
  colors: {
    indigo: "#2A2E8C",    // Primaire — titres, boutons secondaires, liens
    safran: "#F4A51C",    // CTA — boutons principaux, accents
    encre: "#14110F",     // Texte principal
    craie: "#F7F7F5",     // Fond principal
    baobab: "#1F7A50",    // Succès, indicateurs positifs
  },
} as const;

export const credits = {
  unitValue: 10,          // 1 crédit = 10 FCFA
  currency: "FCFA",
  packs: [
    { price: 3_000,   credits: 300,    bonus: 0 },
    { price: 10_000,  credits: 1_050,  bonus: 5 },
    { price: 25_000,  credits: 2_750,  bonus: 10 },
    { price: 50_000,  credits: 5_750,  bonus: 15 },
    { price: 150_000, credits: 18_000, bonus: 20 },
  ],
  costs: {
    analyse_prospect: 4,
    whatsapp_message: 6,
    email: 2,
    sms: 6,
    call_per_minute: 15,
    analyse_activite: 0,
    conversation_apres_reponse: 0,
    rendez_vous: 0,
  },
} as const;
