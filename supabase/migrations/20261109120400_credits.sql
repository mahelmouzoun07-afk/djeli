-- Module 02 : TABLES de crédits (la LOGIQUE est au module 03).
-- Pas d'opération métier ici, juste les structures et les contraintes.

-- ───── Solde par entreprise ────────────────────────────────────────────

create table public.soldes_credits (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid unique not null references public.entreprises(id) on delete cascade,
  solde integer not null default 0,
  reference_alerte integer,          -- solde au dernier rechargement
  alerte_20_envoyee boolean not null default false,
  alerte_5_envoyee boolean not null default false,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  constraint solde_positif check (solde >= 0)
);

create trigger soldes_credits_maj_modifie_le
before update on public.soldes_credits
for each row execute function public.maj_modifie_le();

-- ───── Historique des transactions ─────────────────────────────────────

create table public.transactions_credits (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  type public.type_transaction not null,
  montant integer not null,          -- + pour un ajout, - pour un débit
  solde_apres integer not null,
  motif text,
  reference text,
  cle_idempotence text unique,       -- rend le débit / crédit rejouable
  expire_le timestamptz,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);

create trigger transactions_credits_maj_modifie_le
before update on public.transactions_credits
for each row execute function public.maj_modifie_le();

create index transactions_credits_entreprise_idx
  on public.transactions_credits (entreprise_id, cree_le desc);
create index transactions_credits_expire_idx
  on public.transactions_credits (expire_le)
  where expire_le is not null;

-- ───── Dépenses par jour, par canal, pour le plafond journalier ────────

create table public.depenses_jour (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  campagne_id uuid not null references public.campagnes(id) on delete cascade,
  jour date not null,
  canal public.canal not null,
  credits integer not null default 0,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  unique (campagne_id, jour, canal),
  constraint depenses_credits_positif check (credits >= 0)
);

create trigger depenses_jour_maj_modifie_le
before update on public.depenses_jour
for each row execute function public.maj_modifie_le();

create index depenses_jour_campagne_jour_idx
  on public.depenses_jour (campagne_id, jour);

-- ───── Paiements (Mobile Money) ─────────────────────────────────────────

create table public.paiements (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  prestataire text not null,
  montant_fcfa integer not null,
  credits integer not null,
  bonus integer not null default 0,
  statut public.statut_paiement not null default 'en_attente',
  reference_externe text unique,
  telephone_payeur text,
  operateur text,
  brut jsonb,                        -- réponse complète du prestataire
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  constraint montant_positif check (montant_fcfa > 0),
  constraint credits_positif check (credits > 0),
  constraint bonus_positif check (bonus >= 0)
);

create trigger paiements_maj_modifie_le
before update on public.paiements
for each row execute function public.maj_modifie_le();

create index paiements_entreprise_idx on public.paiements (entreprise_id, cree_le desc);
create index paiements_statut_idx on public.paiements (statut, cree_le);
