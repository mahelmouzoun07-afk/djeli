-- Module 03 : moteur de crédits.
--
-- Principe : chaque achat crée un LOT de crédits avec sa date d'expiration.
-- Les débits consomment les lots du plus proche de l'expiration au plus
-- lointain (FIFO), comme l'exige le modèle économique. L'expiration ne
-- retire que ce qui reste réellement dans les lots échus.
--
-- Toutes les fonctions sont :
--   - security definer (seul le service y touche)
--   - search_path fixé à `public, pg_temp`
--   - exécution révoquée sauf pour service_role

-- ═════════════════════════════════════════════════════════════════════════
-- Table des lots
-- ═════════════════════════════════════════════════════════════════════════

create table public.lots_credits (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  transaction_id uuid references public.transactions_credits(id) on delete set null,
  montant_initial integer not null,
  restant integer not null,
  expire_le timestamptz,              -- null = n'expire jamais
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  constraint lot_montant_positif check (montant_initial > 0),
  constraint lot_restant_borne check (restant >= 0 and restant <= montant_initial)
);

create trigger lots_credits_maj_modifie_le
before update on public.lots_credits
for each row execute function public.maj_modifie_le();

-- Index de consommation FIFO : les lots qui expirent le plus tôt d'abord,
-- `nulls last` pour que les lots sans expiration soient consommés en dernier.
create index lots_credits_fifo_idx
  on public.lots_credits (entreprise_id, expire_le nulls last, cree_le)
  where restant > 0;

create index lots_credits_expiration_idx
  on public.lots_credits (expire_le)
  where restant > 0 and expire_le is not null;

alter table public.lots_credits enable row level security;

create policy lots_credits_lire on public.lots_credits
  for select using (public.est_membre(entreprise_id));

-- ═════════════════════════════════════════════════════════════════════════
-- crediter : ajoute des crédits et ouvre un lot.
-- Idempotent par `cle`.
-- ═════════════════════════════════════════════════════════════════════════

create or replace function public.crediter(
  entreprise uuid,
  montant integer,
  type_tx public.type_transaction,
  motif text,
  reference text,
  cle text,
  expire_le timestamptz default null
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  nouveau_solde integer;
  tx_existante public.transactions_credits%rowtype;
  tx_id uuid;
begin
  if montant <= 0 then
    raise exception 'montant_doit_etre_positif';
  end if;

  if cle is not null then
    select * into tx_existante
    from public.transactions_credits
    where cle_idempotence = cle;

    if found then
      return tx_existante.solde_apres;
    end if;
  end if;

  insert into public.soldes_credits (entreprise_id, solde)
  values (entreprise, 0)
  on conflict (entreprise_id) do nothing;

  update public.soldes_credits
  set solde = solde + montant
  where entreprise_id = entreprise
  returning solde into nouveau_solde;

  -- Un achat ou un bonus fixe la nouvelle référence des alertes 20 % / 5 %
  if type_tx in ('achat', 'bonus') then
    update public.soldes_credits
    set reference_alerte = nouveau_solde,
        alerte_20_envoyee = false,
        alerte_5_envoyee = false
    where entreprise_id = entreprise;
  end if;

  insert into public.transactions_credits
    (entreprise_id, type, montant, solde_apres, motif, reference, cle_idempotence, expire_le)
  values
    (entreprise, type_tx, montant, nouveau_solde, motif, reference, cle, expire_le)
  returning id into tx_id;

  -- Tout ajout de crédits ouvre un lot consommable
  insert into public.lots_credits
    (entreprise_id, transaction_id, montant_initial, restant, expire_le)
  values
    (entreprise, tx_id, montant, montant, expire_le);

  return nouveau_solde;
end;
$$;

-- ═════════════════════════════════════════════════════════════════════════
-- consommer_lots : retire `montant` des lots, du plus proche de l'expiration
-- au plus lointain. Fonction interne, appelée par debiter().
-- ═════════════════════════════════════════════════════════════════════════

create or replace function public.consommer_lots(
  entreprise uuid,
  montant integer
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  reste integer := montant;
  lot record;
  pris integer;
begin
  for lot in
    select id, restant
    from public.lots_credits
    where entreprise_id = entreprise and restant > 0
    order by expire_le nulls last, cree_le
    for update
  loop
    exit when reste <= 0;
    pris := least(lot.restant, reste);
    update public.lots_credits
    set restant = restant - pris
    where id = lot.id;
    reste := reste - pris;
  end loop;

  -- `reste > 0` signifierait que le solde et les lots ont divergé.
  if reste > 0 then
    raise exception 'lots_insuffisants: il manque % crédits en lots', reste;
  end if;
end;
$$;

-- ═════════════════════════════════════════════════════════════════════════
-- debiter : retire des crédits. Vérifie le solde ET le plafond du jour.
-- Idempotent par `cle`. Verrouille la ligne du solde.
-- ═════════════════════════════════════════════════════════════════════════

create type public.resultat_debit as (
  ok boolean,
  solde integer,
  raison text
);

create or replace function public.debiter(
  entreprise uuid,
  montant integer,
  motif text,
  reference text,
  cle text,
  campagne uuid default null,
  canal_debit public.canal default null
)
returns public.resultat_debit
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  resultat public.resultat_debit;
  tx_existante public.transactions_credits%rowtype;
  solde_actuel integer;
  plafond integer;
  fuseau text;
  jour_local date;
  depense_actuelle integer;
  nouveau_solde integer;
begin
  if montant <= 0 then
    resultat := (false, 0, 'montant_doit_etre_positif');
    return resultat;
  end if;

  if cle is not null then
    select * into tx_existante
    from public.transactions_credits
    where cle_idempotence = cle;

    if found then
      resultat := (true, tx_existante.solde_apres, 'deja_debite');
      return resultat;
    end if;
  end if;

  -- Verrou : exclut les débits concurrents sur la même entreprise
  select solde into solde_actuel
  from public.soldes_credits
  where entreprise_id = entreprise
  for update;

  if not found then
    resultat := (false, 0, 'solde_insuffisant');
    return resultat;
  end if;

  if solde_actuel < montant then
    resultat := (false, solde_actuel, 'solde_insuffisant');
    return resultat;
  end if;

  -- Plafond du jour de la campagne, dans le fuseau horaire du client
  if campagne is not null then
    select c.plafond_credits_jour, e.fuseau_horaire
    into plafond, fuseau
    from public.campagnes c
    join public.entreprises e on e.id = c.entreprise_id
    where c.id = campagne;

    jour_local := (now() at time zone coalesce(fuseau, 'UTC'))::date;

    if plafond is not null then
      select coalesce(sum(credits), 0)
      into depense_actuelle
      from public.depenses_jour
      where campagne_id = campagne and jour = jour_local;

      if depense_actuelle + montant > plafond then
        resultat := (false, solde_actuel, 'plafond_jour');
        return resultat;
      end if;
    end if;
  end if;

  -- Consomme les lots les plus anciens, puis baisse le solde
  perform public.consommer_lots(entreprise, montant);

  update public.soldes_credits
  set solde = solde - montant
  where entreprise_id = entreprise
  returning solde into nouveau_solde;

  insert into public.transactions_credits
    (entreprise_id, type, montant, solde_apres, motif, reference, cle_idempotence)
  values
    (entreprise, 'debit', -montant, nouveau_solde, motif, reference, cle);

  if campagne is not null and canal_debit is not null then
    insert into public.depenses_jour (entreprise_id, campagne_id, jour, canal, credits)
    values (entreprise, campagne, jour_local, canal_debit, montant)
    on conflict (campagne_id, jour, canal)
    do update set credits = public.depenses_jour.credits + excluded.credits;
  end if;

  resultat := (true, nouveau_solde, 'ok');
  return resultat;
end;
$$;

-- ═════════════════════════════════════════════════════════════════════════
-- rembourser : recrédite exactement le montant d'un débit, une seule fois.
-- Rouvre un lot sans expiration (le client ne doit pas être pénalisé par
-- un échec d'envoi de notre côté).
-- ═════════════════════════════════════════════════════════════════════════

create or replace function public.rembourser(
  cle_debit text,
  motif text default 'remboursement'
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  tx_debit public.transactions_credits%rowtype;
  cle_remboursement text;
  deja_rembourse public.transactions_credits%rowtype;
  nouveau_solde integer;
  tx_id uuid;
  montant_rendu integer;
begin
  if cle_debit is null then
    raise exception 'cle_debit_obligatoire';
  end if;

  select * into tx_debit
  from public.transactions_credits
  where cle_idempotence = cle_debit and type = 'debit';

  if not found then
    raise exception 'debit_introuvable: %', cle_debit;
  end if;

  cle_remboursement := 'rembourse:' || cle_debit;

  select * into deja_rembourse
  from public.transactions_credits
  where cle_idempotence = cle_remboursement;

  if found then
    return deja_rembourse.solde_apres;
  end if;

  montant_rendu := abs(tx_debit.montant);

  update public.soldes_credits
  set solde = solde + montant_rendu
  where entreprise_id = tx_debit.entreprise_id
  returning solde into nouveau_solde;

  insert into public.transactions_credits
    (entreprise_id, type, montant, solde_apres, motif, reference, cle_idempotence)
  values
    (tx_debit.entreprise_id, 'remboursement', montant_rendu,
     nouveau_solde, motif, cle_debit, cle_remboursement)
  returning id into tx_id;

  insert into public.lots_credits
    (entreprise_id, transaction_id, montant_initial, restant, expire_le)
  values
    (tx_debit.entreprise_id, tx_id, montant_rendu, montant_rendu, null);

  return nouveau_solde;
end;
$$;

-- ═════════════════════════════════════════════════════════════════════════
-- expirer_credits : tâche de nuit. Ferme les lots échus et retire du solde
-- exactement ce qui y restait. Rien d'autre n'est touché.
-- ═════════════════════════════════════════════════════════════════════════

create or replace function public.expirer_credits()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  n_entreprises integer := 0;
  r record;
  nouveau_solde integer;
  cle text;
begin
  for r in
    select entreprise_id, sum(restant) as a_retirer
    from public.lots_credits
    where restant > 0
      and expire_le is not null
      and expire_le <= now()
    group by entreprise_id
  loop
    -- Ferme les lots échus de cette entreprise
    update public.lots_credits
    set restant = 0
    where entreprise_id = r.entreprise_id
      and restant > 0
      and expire_le is not null
      and expire_le <= now();

    update public.soldes_credits
    set solde = greatest(0, solde - r.a_retirer)
    where entreprise_id = r.entreprise_id
    returning solde into nouveau_solde;

    cle := 'expiration:' || r.entreprise_id::text || ':' ||
           to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS');

    insert into public.transactions_credits
      (entreprise_id, type, montant, solde_apres, motif, cle_idempotence)
    values
      (r.entreprise_id, 'expiration', -r.a_retirer, nouveau_solde,
       'expiration automatique des crédits de plus de 12 mois', cle)
    on conflict (cle_idempotence) do nothing;

    n_entreprises := n_entreprises + 1;
  end loop;

  return n_entreprises;
end;
$$;

-- ═════════════════════════════════════════════════════════════════════════
-- Permissions : seule `service_role` appelle ces fonctions.
-- ═════════════════════════════════════════════════════════════════════════

revoke all on function public.crediter(uuid, integer, public.type_transaction, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.consommer_lots(uuid, integer) from public, anon, authenticated;
revoke all on function public.debiter(uuid, integer, text, text, text, uuid, public.canal) from public, anon, authenticated;
revoke all on function public.rembourser(text, text) from public, anon, authenticated;
revoke all on function public.expirer_credits() from public, anon, authenticated;

grant execute on function public.crediter(uuid, integer, public.type_transaction, text, text, text, timestamptz) to service_role;
grant execute on function public.debiter(uuid, integer, text, text, text, uuid, public.canal) to service_role;
grant execute on function public.rembourser(text, text) to service_role;
grant execute on function public.expirer_credits() to service_role;
