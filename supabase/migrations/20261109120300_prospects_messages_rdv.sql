-- Module 02 : prospects, messages, conversations, rendez-vous, intégrations.
-- Les références `annuaire_entreprise_id` et `annuaire_contact_id` sont
-- laissées sans clé étrangère ici : le module 07A les rattache aux tables
-- de l'annuaire quand il les crée.

-- ───── Prospects ────────────────────────────────────────────────────────

create table public.prospects (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  campagne_id uuid not null references public.campagnes(id) on delete cascade,
  annuaire_entreprise_id uuid,     -- FK ajoutée par le module 07A
  annuaire_contact_id uuid,        -- idem
  type_cible public.type_cible not null default 'entreprise',
  nom_entreprise text,
  nom_contact text,
  poste text,
  email citext,
  telephone text,                  -- E.164
  whatsapp text,                   -- E.164
  pays char(2),
  langue text,
  score_adequation smallint,
  -- `analyse` seul est un MOT RÉSERVÉ Postgres (variante de ANALYZE).
  analyse_ia jsonb,                -- rempli au module 08
  canal_prefere public.canal,
  statut public.statut_prospect not null default 'nouveau',
  source text,
  base_legale text,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  constraint score_adequation_bornes
    check (score_adequation is null or (score_adequation between 0 and 100))
);

create trigger prospects_maj_modifie_le
before update on public.prospects
for each row execute function public.maj_modifie_le();

-- Unicité du rapprochement annuaire × campagne (quand il existe)
create unique index prospects_campagne_annuaire_uniq
  on public.prospects (campagne_id, annuaire_entreprise_id)
  where annuaire_entreprise_id is not null;

create index prospects_entreprise_idx on public.prospects (entreprise_id);
create index prospects_campagne_idx on public.prospects (campagne_id);
create index prospects_statut_idx on public.prospects (entreprise_id, statut);
create index prospects_annuaire_entreprise_idx on public.prospects (annuaire_entreprise_id);

-- ───── Boîtes d'envoi et numéros Djeli (globaux, détails en migration 7) ──
-- Déclarés en avance car `messages` y fait référence.

create table public.boites_envoi (
  id uuid primary key default gen_random_uuid(),
  adresse text unique not null,
  domaine text not null,
  fournisseur text not null,
  quota_jour integer not null default 30,
  envoyes_aujourdhui integer not null default 0,
  sante smallint not null default 100,
  en_pause boolean not null default false,
  raison_pause text,
  identifiants_ref text not null,  -- nom du secret, JAMAIS la valeur
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  constraint sante_bornes check (sante between 0 and 100)
);

create trigger boites_envoi_maj_modifie_le
before update on public.boites_envoi
for each row execute function public.maj_modifie_le();

create index boites_envoi_sante_idx on public.boites_envoi (sante, en_pause);

create table public.numeros_djeli (
  id uuid primary key default gen_random_uuid(),
  canal public.canal not null,
  pays char(2) not null,
  numero_e164 text unique not null,
  id_fournisseur text,
  note_qualite smallint,
  limite_jour integer not null default 100,
  envoyes_aujourdhui integer not null default 0,
  en_pause boolean not null default false,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  constraint numeros_djeli_canal check (canal in ('whatsapp', 'sms'))
);

create trigger numeros_djeli_maj_modifie_le
before update on public.numeros_djeli
for each row execute function public.maj_modifie_le();

create index numeros_djeli_canal_pays_idx on public.numeros_djeli (canal, pays);

-- ───── Messages ─────────────────────────────────────────────────────────

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  campagne_id uuid not null references public.campagnes(id) on delete cascade,
  canal public.canal not null,
  sens public.sens_message not null,
  statut public.statut_message not null default 'brouillon',
  etape_sequence smallint,
  sujet text,
  corps text,
  id_externe text,                 -- id chez le fournisseur
  boite_envoi_id uuid references public.boites_envoi(id) on delete set null,
  numero_djeli_id uuid references public.numeros_djeli(id) on delete set null,
  planifie_pour timestamptz,
  envoye_le timestamptz,
  erreur text,
  credits_debites integer not null default 0,
  classe public.classe_reponse,    -- pour les entrants
  piece_jointe_url text,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);

create trigger messages_maj_modifie_le
before update on public.messages
for each row execute function public.maj_modifie_le();

-- Unique (canal, id_externe) quand non nul : évite les doublons des webhooks
create unique index messages_canal_id_externe_uniq
  on public.messages (canal, id_externe)
  where id_externe is not null;

create index messages_entreprise_idx on public.messages (entreprise_id);
create index messages_prospect_idx on public.messages (prospect_id);
create index messages_campagne_idx on public.messages (campagne_id);
create index messages_statut_planifie_idx
  on public.messages (statut, planifie_pour)
  where statut = 'planifie';

-- ───── Conversations ────────────────────────────────────────────────────

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  canal public.canal not null,
  dernier_message_le timestamptz,
  fenetre_24h_jusqua timestamptz,  -- pour WhatsApp
  en_attente_client boolean not null default false,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  unique (prospect_id, canal)
);

create trigger conversations_maj_modifie_le
before update on public.conversations
for each row execute function public.maj_modifie_le();

create index conversations_entreprise_idx on public.conversations (entreprise_id);
create index conversations_attente_idx on public.conversations (entreprise_id, en_attente_client);

-- ───── Rendez-vous ──────────────────────────────────────────────────────

create table public.rendez_vous (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  debut timestamptz not null,
  fin timestamptz not null,
  lieu_ou_lien text,
  google_event_id text,
  statut public.statut_rdv not null default 'propose',
  rappel_envoye boolean not null default false,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  constraint rdv_fin_apres_debut check (fin > debut)
);

create trigger rendez_vous_maj_modifie_le
before update on public.rendez_vous
for each row execute function public.maj_modifie_le();

create index rendez_vous_entreprise_idx on public.rendez_vous (entreprise_id);
create index rendez_vous_debut_idx on public.rendez_vous (debut);

-- ───── Intégrations (Google Agenda, etc.) ──────────────────────────────

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references public.entreprises(id) on delete cascade,
  type public.type_integration not null,
  jeton_ref text not null,         -- référence vers un coffre, JAMAIS le jeton en clair
  actif boolean not null default true,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  unique (entreprise_id, type)
);

create trigger integrations_maj_modifie_le
before update on public.integrations
for each row execute function public.maj_modifie_le();
