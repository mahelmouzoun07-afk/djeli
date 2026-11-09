import { z } from "zod";
import { CODES_AUTORISES } from "@/lib/donnees/pays";
import { estTelephoneValide } from "@/lib/donnees/telephone";

/**
 * Schémas zod des formulaires d'authentification.
 * Tous les messages sont en français : ils sont montrés au client.
 */

const email = z
  .string()
  .trim()
  .min(1, "L'adresse email est obligatoire.")
  .max(255, "Cette adresse email est trop longue.")
  .email("Cette adresse email n'est pas valide.")
  .transform((v) => v.toLowerCase());

const motDePasse = z
  .string()
  .min(8, "Le mot de passe doit faire au moins 8 caractères.")
  .max(72, "Le mot de passe ne peut pas dépasser 72 caractères.");

const pays = z
  .string()
  .trim()
  .toUpperCase()
  .refine((v) => CODES_AUTORISES.includes(v), {
    message: "Ce pays n'est pas encore couvert par Djeli.",
  });

export const schemaInscription = z
  .object({
    email,
    motDePasse,
    nomComplet: z
      .string()
      .trim()
      .min(2, "Votre nom est obligatoire.")
      .max(120, "Ce nom est trop long."),
    nomEntreprise: z
      .string()
      .trim()
      .min(2, "Le nom de votre entreprise est obligatoire.")
      .max(160, "Ce nom est trop long."),
    pays,
    telephone: z.string().trim().optional().or(z.literal("")),
    jetonAnalyse: z.string().trim().max(128).optional().or(z.literal("")),
  })
  .refine(
    (v) => !v.telephone || estTelephoneValide(v.telephone, v.pays),
    {
      message: "Ce numéro de téléphone n'est pas valide pour ce pays.",
      path: ["telephone"],
    },
  );

export const schemaConnexion = z.object({
  email,
  motDePasse: z.string().min(1, "Le mot de passe est obligatoire."),
});

export const schemaLienMagique = z.object({
  email,
  jetonAnalyse: z.string().trim().max(128).optional().or(z.literal("")),
});

export const schemaMotDePasseOublie = z.object({ email });

export const schemaChangerMotDePasse = z
  .object({
    nouveau: motDePasse,
    confirmation: z.string(),
  })
  .refine((v) => v.nouveau === v.confirmation, {
    message: "Les deux mots de passe ne sont pas identiques.",
    path: ["confirmation"],
  });

export const schemaCreerEntreprise = z.object({
  nomEntreprise: z
    .string()
    .trim()
    .min(2, "Le nom de votre entreprise est obligatoire.")
    .max(160, "Ce nom est trop long."),
  pays,
  jetonAnalyse: z.string().trim().max(128).optional().or(z.literal("")),
});

export type DonneesInscription = z.infer<typeof schemaInscription>;
export type DonneesConnexion = z.infer<typeof schemaConnexion>;
export type DonneesCreerEntreprise = z.infer<typeof schemaCreerEntreprise>;

/** Transforme une erreur zod en message simple pour l'utilisateur. */
export function premierMessage(erreur: z.ZodError): string {
  return erreur.issues[0]?.message ?? "Les informations saisies sont invalides.";
}
