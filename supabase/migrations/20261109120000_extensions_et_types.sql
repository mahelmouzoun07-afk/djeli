-- Module 02 : extensions et types partagés.
-- Préalable à toutes les autres migrations du module.

-- ───── Extensions ────────────────────────────────────────────────────────

create extension if not exists postgis;
create extension if not exists pg_trgm;
create extension if not exists unaccent;
create extension if not exists citext;

-- ───── Trigger partagé : maj_modifie_le ──────────────────────────────────
-- Chaque table ayant la colonne `modifie_le` reçoit ce trigger.
-- Fonction immuable, sans accès au reste du schéma.

create or replace function public.maj_modifie_le()
returns trigger
language plpgsql
as $$
begin
  new.modifie_le := now();
  return new;
end;
$$;

-- ───── Types enum ────────────────────────────────────────────────────────

create type public.canal as enum ('email', 'whatsapp', 'sms', 'appel');

create type public.sens_message as enum ('sortant', 'entrant');

create type public.statut_message as enum (
  'brouillon', 'planifie', 'envoye', 'livre', 'lu', 'echoue', 'bloque'
);

create type public.statut_campagne as enum (
  'brouillon', 'active', 'en_pause', 'terminee'
);

create type public.statut_prospect as enum (
  'nouveau', 'analyse', 'contacte', 'a_repondu', 'interesse',
  'rdv_pris', 'pas_interesse', 'desinscrit', 'injoignable'
);

create type public.classe_reponse as enum (
  'interesse', 'question', 'pas_maintenant', 'refus', 'absent',
  'desinscription', 'note_vocale_incomprise', 'autre'
);

create type public.type_transaction as enum (
  'achat', 'bonus', 'debit', 'remboursement', 'ajustement', 'expiration'
);

create type public.mode_repartition as enum ('automatique', 'manuel');

create type public.type_cible as enum ('entreprise', 'particulier');

create type public.role_membre as enum ('proprietaire', 'membre');

create type public.statut_rdv as enum (
  'propose', 'confirme', 'annule', 'honore', 'non_venu'
);

create type public.statut_paiement as enum (
  'en_attente', 'reussi', 'echoue', 'rembourse'
);

create type public.type_integration as enum ('google_agenda');
