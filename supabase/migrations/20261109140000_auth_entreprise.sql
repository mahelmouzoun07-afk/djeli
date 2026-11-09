-- Module 04 : authentification et création de l'entreprise.
--
-- Deux besoins :
--   1. garder l'analyse faite AVANT l'inscription, pour la rattacher au
--      compte dès sa création (le visiteur ne refait rien) ;
--   2. limiter les tentatives de connexion et d'inscription.

-- ═════════════════════════════════════════════════════════════════════════
-- Analyses faites avant inscription
-- ═════════════════════════════════════════════════════════════════════════

create table public.analyses_anonymes (
  id uuid primary key default gen_random_uuid(),
  jeton text unique not null,          -- 32 octets aléatoires, en base64url
  entree text not null,                -- le lien collé ou la description
  type_entree text not null default 'lien',
  pays char(2),
  resultat jsonb,                      -- rempli par le module 06
  etat text not null default 'en_cours',
  rattachee_a uuid references public.entreprises(id) on delete set null,
  rattachee_le timestamptz,
  ip_hash text,                        -- IP hachée, pour la limite d'abus
  expire_le timestamptz not null default now() + interval '7 days',
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  constraint type_entree_valide
    check (type_entree in ('lien', 'description')),
  constraint etat_valide
    check (etat in ('en_cours', 'questions', 'pret', 'echec'))
);

create trigger analyses_anonymes_maj_modifie_le
before update on public.analyses_anonymes
for each row execute function public.maj_modifie_le();

create index analyses_anonymes_expire_idx on public.analyses_anonymes (expire_le);
create index analyses_anonymes_rattachee_idx on public.analyses_anonymes (rattachee_a);

-- Service uniquement : aucune politique pour anon / authenticated.
alter table public.analyses_anonymes enable row level security;

-- ═════════════════════════════════════════════════════════════════════════
-- Limite de fréquence (connexion, inscription, analyse gratuite)
-- ═════════════════════════════════════════════════════════════════════════

create table public.tentatives (
  id uuid primary key default gen_random_uuid(),
  cle text not null,                   -- ex. "connexion:a@b.com" ou "inscription:<ip_hash>"
  action text not null,                -- 'connexion', 'inscription', 'analyse'
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);

create trigger tentatives_maj_modifie_le
before update on public.tentatives
for each row execute function public.maj_modifie_le();

create index tentatives_cle_date_idx on public.tentatives (cle, cree_le desc);

alter table public.tentatives enable row level security;

/**
 * Compte les tentatives récentes et en enregistre une nouvelle.
 * Renvoie `true` si l'action est AUTORISÉE (limite non atteinte).
 *
 * La tentative n'est enregistrée que si elle est autorisée : sinon un
 * attaquant prolongerait indéfiniment son propre blocage, et un
 * utilisateur légitime resterait bloqué en réessayant.
 */
create or replace function public.verifier_limite(
  cle text,
  action text,
  maximum integer,
  fenetre interval
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  n integer;
begin
  delete from public.tentatives
  where cree_le < now() - interval '24 hours';

  select count(*) into n
  from public.tentatives t
  where t.cle = verifier_limite.cle
    and t.action = verifier_limite.action
    and t.cree_le > now() - fenetre;

  if n >= maximum then
    return false;
  end if;

  insert into public.tentatives (cle, action) values (cle, action);
  return true;
end;
$$;

/** Efface les tentatives d'une clé : appelée après un succès. */
create or replace function public.reinitialiser_limite(cle text, action text)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from public.tentatives t
  where t.cle = reinitialiser_limite.cle
    and t.action = reinitialiser_limite.action;
$$;

-- ═════════════════════════════════════════════════════════════════════════
-- Création de l'entreprise à l'inscription
--
-- Fait tout d'un coup, dans une seule transaction :
--   entreprise + membre propriétaire + solde à 0 + rattachement de l'analyse
-- ═════════════════════════════════════════════════════════════════════════

create or replace function public.creer_entreprise_pour_utilisateur(
  nom text,
  pays text default null,
  jeton_analyse text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  utilisateur uuid := auth.uid();
  entreprise_id uuid;
  analyse public.analyses_anonymes%rowtype;
  deja uuid;
begin
  if utilisateur is null then
    raise exception 'non_authentifie';
  end if;

  if nom is null or btrim(nom) = '' then
    raise exception 'nom_entreprise_obligatoire';
  end if;

  -- Un utilisateur ne crée qu'une entreprise : s'il en a déjà une, on la
  -- renvoie (rend la fonction rejouable sans effet double).
  select m.entreprise_id into deja
  from public.membres m
  where m.profil_id = utilisateur
  limit 1;

  if deja is not null then
    return deja;
  end if;

  insert into public.entreprises (nom, pays)
  values (btrim(nom), nullif(upper(btrim(coalesce(pays, ''))), ''))
  returning id into entreprise_id;

  insert into public.membres (entreprise_id, profil_id, role)
  values (entreprise_id, utilisateur, 'proprietaire');

  insert into public.soldes_credits (entreprise_id, solde)
  values (entreprise_id, 0);

  -- Rattache l'analyse faite avant l'inscription, si le jeton est encore bon
  if jeton_analyse is not null then
    select * into analyse
    from public.analyses_anonymes
    where jeton = jeton_analyse
      and expire_le > now()
      and rattachee_a is null
    for update;

    if found then
      update public.analyses_anonymes
      set rattachee_a = entreprise_id,
          rattachee_le = now()
      where id = analyse.id;

      update public.entreprises
      set analyse_ia = analyse.resultat,
          analyse_le = case when analyse.resultat is not null then now() end,
          site_web = case when analyse.type_entree = 'lien' then analyse.entree end,
          description = case when analyse.type_entree = 'description' then analyse.entree end,
          pays = coalesce(entreprises.pays, analyse.pays)
      where id = entreprise_id;
    end if;
  end if;

  return entreprise_id;
end;
$$;

-- ═════════════════════════════════════════════════════════════════════════
-- Permissions
-- ═════════════════════════════════════════════════════════════════════════

-- creer_entreprise_pour_utilisateur est appelée par l'utilisateur qui vient
-- de s'inscrire : elle doit être exécutable par `authenticated`.
-- Elle lit auth.uid() elle-même, donc on ne peut pas créer une entreprise
-- au nom de quelqu'un d'autre.
revoke all on function public.creer_entreprise_pour_utilisateur(text, text, text) from public, anon;
grant execute on function public.creer_entreprise_pour_utilisateur(text, text, text) to authenticated, service_role;

revoke all on function public.verifier_limite(text, text, integer, interval) from public, anon, authenticated;
revoke all on function public.reinitialiser_limite(text, text) from public, anon, authenticated;
grant execute on function public.verifier_limite(text, text, integer, interval) to service_role;
grant execute on function public.reinitialiser_limite(text, text) to service_role;
