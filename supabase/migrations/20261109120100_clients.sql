-- Module 02 : profils, entreprises, membres, fonction `est_membre`.

-- ───── Profils ──────────────────────────────────────────────────────────
-- 1 ligne par utilisateur Supabase Auth.

create table public.profils (
  id uuid primary key references auth.users(id) on delete cascade,
  nom_complet text,
  telephone text,
  langue text not null default 'fr',
  est_admin boolean not null default false,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);

create trigger profils_maj_modifie_le
before update on public.profils
for each row execute function public.maj_modifie_le();

-- Création automatique du profil à l'inscription d'un utilisateur.
create or replace function public.creer_profil_a_inscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profils (id, nom_complet, telephone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nom_complet', ''),
    coalesce(new.raw_user_meta_data->>'telephone', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger auth_user_cree_profil
after insert on auth.users
for each row execute function public.creer_profil_a_inscription();

-- ───── Entreprises (clientes de Djeli) ──────────────────────────────────

create table public.entreprises (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  site_web text,
  description text,
  pays char(2),                      -- code ISO 3166-1 alpha-2
  ville text,
  secteur text,
  -- `analyse` seul est un MOT RÉSERVÉ Postgres (variante de ANALYZE) :
  -- toujours nommer cette colonne `analyse_ia`.
  analyse_ia jsonb,                  -- rempli au module 06
  analyse_le timestamptz,
  style_valide boolean not null default false,
  nom_signature text,                -- ex. "Koffi, du Studio Koffi"
  whatsapp_notification text,        -- E.164
  fuseau_horaire text not null default 'Africa/Porto-Novo',
  premier_achat_fait boolean not null default false,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);

create trigger entreprises_maj_modifie_le
before update on public.entreprises
for each row execute function public.maj_modifie_le();

create index entreprises_pays_idx on public.entreprises (pays);

-- ───── Membres : qui a accès à quelle entreprise ────────────────────────

create table public.membres (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  profil_id uuid not null references public.profils(id) on delete cascade,
  role public.role_membre not null default 'proprietaire',
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  unique (entreprise_id, profil_id)
);

create trigger membres_maj_modifie_le
before update on public.membres
for each row execute function public.maj_modifie_le();

create index membres_profil_idx on public.membres (profil_id);
create index membres_entreprise_idx on public.membres (entreprise_id);

-- ───── Fonction `est_membre(entreprise)` ────────────────────────────────
-- Utilisée par toutes les politiques RLS. `security definer` pour pouvoir
-- lire `membres` sans que le caller ait besoin d'un SELECT direct dessus
-- (évite les récursions de politiques).

create or replace function public.est_membre(entreprise uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.membres m
    where m.entreprise_id = entreprise
      and m.profil_id = auth.uid()
  );
$$;

create or replace function public.est_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profils where id = auth.uid() and est_admin = true
  );
$$;
