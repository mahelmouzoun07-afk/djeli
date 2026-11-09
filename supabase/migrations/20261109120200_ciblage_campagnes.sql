-- Module 02 : profils cibles et campagnes.

-- ───── Profils cibles ──────────────────────────────────────────────────
-- Un profil décrit un segment que l'IA cherchera dans l'annuaire.

create table public.profils_cibles (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  nom text not null,
  type_cible public.type_cible not null default 'entreprise',
  secteurs text[] not null default '{}',
  tailles text[] not null default '{}',
  pays text[] not null default '{}',       -- codes ISO
  villes text[] not null default '{}',
  signaux_achat text[] not null default '{}',
  angle text,                              -- l'argument principal
  actif boolean not null default true,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);

create trigger profils_cibles_maj_modifie_le
before update on public.profils_cibles
for each row execute function public.maj_modifie_le();

create index profils_cibles_entreprise_idx on public.profils_cibles (entreprise_id);
create index profils_cibles_actif_idx on public.profils_cibles (entreprise_id, actif);

-- ───── Campagnes ────────────────────────────────────────────────────────

create table public.campagnes (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  profil_cible_id uuid references public.profils_cibles(id) on delete set null,
  nom text not null,
  statut public.statut_campagne not null default 'brouillon',
  canaux_autorises public.canal[] not null default '{email, whatsapp}',
  mode_repartition public.mode_repartition not null default 'automatique',
  repartition jsonb,                       -- ex. {"email":40,"whatsapp":60}
  plafond_credits_jour integer,            -- null = pas de plafond
  sequence jsonb,                          -- étapes J1/J3/J5/...
  demarree_le timestamptz,
  terminee_le timestamptz,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  constraint plafond_credits_jour_positif
    check (plafond_credits_jour is null or plafond_credits_jour > 0)
);

create trigger campagnes_maj_modifie_le
before update on public.campagnes
for each row execute function public.maj_modifie_le();

create index campagnes_entreprise_idx on public.campagnes (entreprise_id);
create index campagnes_statut_idx on public.campagnes (statut);
create index campagnes_profil_cible_idx on public.campagnes (profil_cible_id);
