-- Module 02 : tables globales de conformité et d'envoi.
-- Les 2 tables `boites_envoi` et `numeros_djeli` ont été créées à la
-- migration précédente (dépendance de `messages`). On ajoute ici le reste.

-- ───── Désinscriptions (STOP) : global à TOUS les clients de Djeli ─────

create table public.opt_outs (
  id uuid primary key default gen_random_uuid(),
  valeur citext unique not null,     -- email ou téléphone E.164
  canal public.canal,                 -- null = tous canaux
  raison text,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);

create trigger opt_outs_maj_modifie_le
before update on public.opt_outs
for each row execute function public.maj_modifie_le();

create index opt_outs_canal_idx on public.opt_outs (canal);

-- ───── Contacts récents : 1 premier message par semaine max ────────────

create table public.contacts_recents (
  id uuid primary key default gen_random_uuid(),
  valeur citext unique not null,
  dernier_premier_message_le timestamptz not null default now(),
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);

create trigger contacts_recents_maj_modifie_le
before update on public.contacts_recents
for each row execute function public.maj_modifie_le();

-- ───── Jours fériés par pays ────────────────────────────────────────────

create table public.jours_feries (
  id uuid primary key default gen_random_uuid(),
  pays char(2) not null,
  jour date not null,
  nom text not null,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  unique (pays, jour)
);

create trigger jours_feries_maj_modifie_le
before update on public.jours_feries
for each row execute function public.maj_modifie_le();

create index jours_feries_pays_jour_idx on public.jours_feries (pays, jour);

-- ───── Journal d'événements (audit, support, litiges) ──────────────────

create table public.journal_evenements (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid references public.entreprises(id) on delete set null,
  type text not null,
  donnees jsonb,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);

create trigger journal_evenements_maj_modifie_le
before update on public.journal_evenements
for each row execute function public.maj_modifie_le();

create index journal_evenements_type_idx on public.journal_evenements (type, cree_le desc);
create index journal_evenements_entreprise_idx
  on public.journal_evenements (entreprise_id, cree_le desc);
