-- Module 03 : moteur de crédits.
-- Toutes les fonctions sont :
--   - security definer (contournent la RLS pour que seul le service y touche)
--   - search_path fixé à `public, pg_temp` (évite les attaques par shadowing)
--   - revoked for public/anon/authenticated, granted to service_role seulement

-- ═════════════════════════════════════════════════════════════════════════
-- crediter : ajoute `montant` crédits au solde d'une entreprise.
-- Idempotent : si `cle` existe déjà dans transactions_credits, aucune
-- écriture et renvoi du solde courant.
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
begin
  if montant <= 0 then
    raise exception 'montant_doit_etre_positif';
  end if;

  -- Idempotence
  if cle is not null then
    select * into tx_existante
    from public.transactions_credits
    where cle_idempotence = cle;

    if found then
      return tx_existante.solde_apres;
    end if;
  end if;

  -- Verrouille la ligne solde (la crée si absente)
  insert into public.soldes_credits (entreprise_id, solde)
  values (entreprise, 0)
  on conflict (entreprise_id) do nothing;

  update public.soldes_credits
  set solde = solde + montant
  where entreprise_id = entreprise
  returning solde into nouveau_solde;

  -- Si c'est un achat, le solde servira de référence pour les alertes 20 % / 5 %
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
    (entreprise, type_tx, montant, nouveau_solde, motif, reference, cle, expire_le);

  return nouveau_solde;
end;
$$;

-- ═════════════════════════════════════════════════════════════════════════
-- debiter : retire `montant` crédits. Vérifie solde ET plafond du jour.
-- Idempotent : rejoue renvoie le même résultat.
-- Verrouille la ligne solde (SELECT ... FOR UPDATE).
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
    resultat.ok := false;
    resultat.solde := 0;
    resultat.raison := 'montant_doit_etre_positif';
    return resultat;
  end if;

  -- Idempotence : si la clé existe, on renvoie le même résultat qu'avant.
  if cle is not null then
    select * into tx_existante
    from public.transactions_credits
    where cle_idempotence = cle;

    if found then
      resultat.ok := true;
      resultat.solde := tx_existante.solde_apres;
      resultat.raison := 'deja_debite';
      return resultat;
    end if;
  end if;

  -- Verrouille le solde pour exclure les débits concurrents
  select solde into solde_actuel
  from public.soldes_credits
  where entreprise_id = entreprise
  for update;

  if not found then
    resultat.ok := false;
    resultat.solde := 0;
    resultat.raison := 'solde_insuffisant';
    return resultat;
  end if;

  if solde_actuel < montant then
    resultat.ok := false;
    resultat.solde := solde_actuel;
    resultat.raison := 'solde_insuffisant';
    return resultat;
  end if;

  -- Vérifie le plafond du jour pour la campagne (si fourni)
  if campagne is not null then
    select c.plafond_credits_jour, e.fuseau_horaire
    into plafond, fuseau
    from public.campagnes c
    join public.entreprises e on e.id = c.entreprise_id
    where c.id = campagne;

    if plafond is not null then
      jour_local := (now() at time zone coalesce(fuseau, 'UTC'))::date;

      select coalesce(sum(credits), 0)
      into depense_actuelle
      from public.depenses_jour
      where campagne_id = campagne and jour = jour_local;

      if depense_actuelle + montant > plafond then
        resultat.ok := false;
        resultat.solde := solde_actuel;
        resultat.raison := 'plafond_jour';
        return resultat;
      end if;
    end if;
  end if;

  -- Débit
  update public.soldes_credits
  set solde = solde - montant
  where entreprise_id = entreprise
  returning solde into nouveau_solde;

  insert into public.transactions_credits
    (entreprise_id, type, montant, solde_apres, motif, reference, cle_idempotence)
  values
    (entreprise, 'debit', -montant, nouveau_solde, motif, reference, cle);

  -- Incrémente le compteur jour × canal × campagne (upsert)
  if campagne is not null and canal_debit is not null then
    insert into public.depenses_jour (entreprise_id, campagne_id, jour, canal, credits)
    values (
      entreprise,
      campagne,
      (now() at time zone coalesce(fuseau, 'UTC'))::date,
      canal_debit,
      montant
    )
    on conflict (campagne_id, jour, canal)
    do update set credits = public.depenses_jour.credits + excluded.credits;
  end if;

  resultat.ok := true;
  resultat.solde := nouveau_solde;
  resultat.raison := 'ok';
  return resultat;
end;
$$;

-- ═════════════════════════════════════════════════════════════════════════
-- rembourser : recrédite exactement le montant d'un débit, une seule fois.
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

  -- Clé du remboursement : préfixe pour éviter la collision avec le débit
  cle_remboursement := 'rembourse:' || cle_debit;

  select * into deja_rembourse
  from public.transactions_credits
  where cle_idempotence = cle_remboursement;

  if found then
    return deja_rembourse.solde_apres;
  end if;

  update public.soldes_credits
  set solde = solde + abs(tx_debit.montant)
  where entreprise_id = tx_debit.entreprise_id
  returning solde into nouveau_solde;

  insert into public.transactions_credits
    (entreprise_id, type, montant, solde_apres, motif, reference, cle_idempotence)
  values
    (tx_debit.entreprise_id, 'remboursement', abs(tx_debit.montant),
     nouveau_solde, motif, cle_debit, cle_remboursement);

  return nouveau_solde;
end;
$$;

-- ═════════════════════════════════════════════════════════════════════════
-- expirer_credits : tâche de nuit. Retire les crédits non consommés dont
-- l'expiration est passée.
--
-- Algo : pour chaque entreprise, somme les (achat + bonus) expirés, puis la
-- somme des (debit + expiration + remboursement) depuis l'achat expiré.
-- La différence est le "pot" qui expire ; on crédite -différence (type
-- `expiration`) pour l'inscrire à l'historique sans jamais aller en négatif.
-- ═════════════════════════════════════════════════════════════════════════

create or replace function public.expirer_credits()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  n_expirees integer := 0;
  r record;
  pot_restant integer;
  solde_actuel integer;
  a_expirer integer;
  nouveau_solde integer;
  cle text;
begin
  for r in
    select entreprise_id,
           sum(montant) filter (where type in ('achat', 'bonus') and expire_le is not null and expire_le <= now()) as credites_expires
    from public.transactions_credits
    group by entreprise_id
    having coalesce(sum(montant) filter (where type in ('achat', 'bonus') and expire_le is not null and expire_le <= now()), 0) > 0
  loop
    -- Crédits déjà sortis depuis le début (débits + remboursements + expirations passées)
    select coalesce(sum(case
              when type = 'debit' then abs(montant)
              when type = 'expiration' then abs(montant)
              else 0
            end), 0)
      - coalesce(sum(case when type = 'remboursement' then montant else 0 end), 0)
    into pot_restant
    from public.transactions_credits
    where entreprise_id = r.entreprise_id;

    -- Ce qu'il reste à prélever sur les crédits expirés
    a_expirer := r.credites_expires - pot_restant;
    if a_expirer <= 0 then
      continue;
    end if;

    -- On ne retire pas plus que le solde courant
    select solde into solde_actuel
    from public.soldes_credits
    where entreprise_id = r.entreprise_id
    for update;

    if solde_actuel is null or solde_actuel = 0 then
      continue;
    end if;

    a_expirer := least(a_expirer, solde_actuel);

    update public.soldes_credits
    set solde = solde - a_expirer
    where entreprise_id = r.entreprise_id
    returning solde into nouveau_solde;

    cle := 'expiration:' || r.entreprise_id::text || ':' ||
           to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS');

    insert into public.transactions_credits
      (entreprise_id, type, montant, solde_apres, motif, cle_idempotence)
    values
      (r.entreprise_id, 'expiration', -a_expirer, nouveau_solde,
       'expiration automatique des crédits de plus de 12 mois', cle);

    n_expirees := n_expirees + 1;
  end loop;

  return n_expirees;
end;
$$;

-- ═════════════════════════════════════════════════════════════════════════
-- Permissions : seule `service_role` appelle ces fonctions.
-- ═════════════════════════════════════════════════════════════════════════

revoke all on function public.crediter(uuid, integer, public.type_transaction, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.debiter(uuid, integer, text, text, text, uuid, public.canal) from public, anon, authenticated;
revoke all on function public.rembourser(text, text) from public, anon, authenticated;
revoke all on function public.expirer_credits() from public, anon, authenticated;

grant execute on function public.crediter(uuid, integer, public.type_transaction, text, text, text, timestamptz) to service_role;
grant execute on function public.debiter(uuid, integer, text, text, text, uuid, public.canal) to service_role;
grant execute on function public.rembourser(text, text) to service_role;
grant execute on function public.expirer_credits() to service_role;
