-- Module 02 : Row Level Security (RLS).
-- Règle d'or : un client ne voit QUE les données de son entreprise.
-- Tables partagées (opt_outs, boîtes, numéros, journal) : réservées au service.

-- ═════════════════════════════════════════════════════════════════════════
-- Profils : chacun lit et modifie le sien
-- ═════════════════════════════════════════════════════════════════════════

alter table public.profils enable row level security;

create policy profils_lire_le_sien on public.profils
  for select using (id = auth.uid());

create policy profils_modifier_le_sien on public.profils
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Pas d'INSERT direct : le trigger auth_user_cree_profil s'en occupe.
-- Pas de DELETE direct : géré par on delete cascade depuis auth.users.

-- ═════════════════════════════════════════════════════════════════════════
-- Entreprises : membres uniquement
-- ═════════════════════════════════════════════════════════════════════════

alter table public.entreprises enable row level security;

create policy entreprises_lire on public.entreprises
  for select using (public.est_membre(id));

create policy entreprises_modifier on public.entreprises
  for update using (public.est_membre(id)) with check (public.est_membre(id));

-- L'INSERT se fait par une fonction `security definer` au module 04
-- (createEntrepriseForUser). Pas de politique d'INSERT ici.

-- ═════════════════════════════════════════════════════════════════════════
-- Membres : lecture par les membres de l'entreprise
-- ═════════════════════════════════════════════════════════════════════════

alter table public.membres enable row level security;

create policy membres_lire on public.membres
  for select using (public.est_membre(entreprise_id));

-- INSERT, UPDATE, DELETE : géré par les fonctions `security definer`
-- du module 04 (invitations, retraits). Pas de politique client.

-- ═════════════════════════════════════════════════════════════════════════
-- Profils cibles : lecture et écriture par les membres
-- ═════════════════════════════════════════════════════════════════════════

alter table public.profils_cibles enable row level security;

create policy profils_cibles_lire on public.profils_cibles
  for select using (public.est_membre(entreprise_id));

create policy profils_cibles_inserer on public.profils_cibles
  for insert with check (public.est_membre(entreprise_id));

create policy profils_cibles_modifier on public.profils_cibles
  for update using (public.est_membre(entreprise_id))
  with check (public.est_membre(entreprise_id));

create policy profils_cibles_supprimer on public.profils_cibles
  for delete using (public.est_membre(entreprise_id));

-- ═════════════════════════════════════════════════════════════════════════
-- Campagnes : lecture et écriture par les membres
-- ═════════════════════════════════════════════════════════════════════════

alter table public.campagnes enable row level security;

create policy campagnes_lire on public.campagnes
  for select using (public.est_membre(entreprise_id));

create policy campagnes_inserer on public.campagnes
  for insert with check (public.est_membre(entreprise_id));

create policy campagnes_modifier on public.campagnes
  for update using (public.est_membre(entreprise_id))
  with check (public.est_membre(entreprise_id));

create policy campagnes_supprimer on public.campagnes
  for delete using (public.est_membre(entreprise_id));

-- ═════════════════════════════════════════════════════════════════════════
-- Prospects : lecture seule pour les clients (création par le serveur)
-- ═════════════════════════════════════════════════════════════════════════

alter table public.prospects enable row level security;

create policy prospects_lire on public.prospects
  for select using (public.est_membre(entreprise_id));

-- ═════════════════════════════════════════════════════════════════════════
-- Messages : LECTURE seulement (envoi géré par le serveur)
-- ═════════════════════════════════════════════════════════════════════════

alter table public.messages enable row level security;

create policy messages_lire on public.messages
  for select using (public.est_membre(entreprise_id));

-- ═════════════════════════════════════════════════════════════════════════
-- Conversations : lecture seule
-- ═════════════════════════════════════════════════════════════════════════

alter table public.conversations enable row level security;

create policy conversations_lire on public.conversations
  for select using (public.est_membre(entreprise_id));

-- ═════════════════════════════════════════════════════════════════════════
-- Rendez-vous : lecture et écriture par les membres
-- ═════════════════════════════════════════════════════════════════════════

alter table public.rendez_vous enable row level security;

create policy rendez_vous_lire on public.rendez_vous
  for select using (public.est_membre(entreprise_id));

create policy rendez_vous_inserer on public.rendez_vous
  for insert with check (public.est_membre(entreprise_id));

create policy rendez_vous_modifier on public.rendez_vous
  for update using (public.est_membre(entreprise_id))
  with check (public.est_membre(entreprise_id));

create policy rendez_vous_supprimer on public.rendez_vous
  for delete using (public.est_membre(entreprise_id));

-- ═════════════════════════════════════════════════════════════════════════
-- Intégrations : lecture seule (écriture par le serveur via OAuth)
-- ═════════════════════════════════════════════════════════════════════════

alter table public.integrations enable row level security;

create policy integrations_lire on public.integrations
  for select using (public.est_membre(entreprise_id));

-- ═════════════════════════════════════════════════════════════════════════
-- Crédits : lecture seule pour les clients
-- ═════════════════════════════════════════════════════════════════════════

alter table public.soldes_credits enable row level security;

create policy soldes_credits_lire on public.soldes_credits
  for select using (public.est_membre(entreprise_id));

alter table public.transactions_credits enable row level security;

create policy transactions_credits_lire on public.transactions_credits
  for select using (public.est_membre(entreprise_id));

alter table public.depenses_jour enable row level security;

create policy depenses_jour_lire on public.depenses_jour
  for select using (public.est_membre(entreprise_id));

alter table public.paiements enable row level security;

create policy paiements_lire on public.paiements
  for select using (public.est_membre(entreprise_id));

-- ═════════════════════════════════════════════════════════════════════════
-- Tables GLOBALES (service uniquement : aucune politique = aucun accès
-- pour anon et authenticated). Elles restent lisibles par service_role.
-- ═════════════════════════════════════════════════════════════════════════

alter table public.opt_outs enable row level security;
alter table public.boites_envoi enable row level security;
alter table public.numeros_djeli enable row level security;
alter table public.contacts_recents enable row level security;
alter table public.jours_feries enable row level security;
alter table public.journal_evenements enable row level security;

-- Jours fériés : lecture publique utile (afficher les horaires côté client)
create policy jours_feries_lire_tous on public.jours_feries
  for select to authenticated using (true);
