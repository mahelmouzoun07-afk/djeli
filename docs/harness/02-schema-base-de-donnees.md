# Module 02 : schéma de la base de données

## Objectif
Créer toutes les tables, les types, les index et la sécurité (RLS). C'est la colonne vertébrale du projet : prends le temps de bien le faire.

## Prérequis
Module 01 terminé.

## Règles
- Une migration par thème, dans l'ordre ci-dessous
- Toutes les tables ont `id uuid primary key default gen_random_uuid()`, `cree_le timestamptz not null default now()`, `modifie_le timestamptz not null default now()` (mis à jour par un trigger commun `maj_modifie_le()`)
- Clés étrangères avec `on delete cascade` vers l'entreprise cliente, sauf mention contraire
- Index sur chaque clé étrangère et chaque colonne utilisée en filtre
- Après les migrations : `npm run db:types`

## Migration 1 : extensions et types
- Extensions : `postgis`, `pg_trgm`, `unaccent`, `citext`
- Types `enum` :
  - `canal` : `email`, `whatsapp`, `sms`, `appel`
  - `sens_message` : `sortant`, `entrant`
  - `statut_message` : `brouillon`, `planifie`, `envoye`, `livre`, `lu`, `echoue`, `bloque`
  - `statut_campagne` : `brouillon`, `active`, `en_pause`, `terminee`
  - `statut_prospect` : `nouveau`, `analyse`, `contacte`, `a_repondu`, `interesse`, `rdv_pris`, `pas_interesse`, `desinscrit`, `injoignable`
  - `classe_reponse` : `interesse`, `question`, `pas_maintenant`, `refus`, `absent`, `desinscription`, `note_vocale_incomprise`, `autre`
  - `type_transaction` : `achat`, `bonus`, `debit`, `remboursement`, `ajustement`, `expiration`
  - `mode_repartition` : `automatique`, `manuel`
  - `type_cible` : `entreprise`, `particulier`
  - `role_membre` : `proprietaire`, `membre`

## Migration 2 : clients
- `profils` : `id` = `auth.users.id`, `nom_complet`, `telephone`, `langue` (défaut `fr`). Trigger qui crée le profil à l'inscription
- `entreprises` (le client de Djeli) : `nom`, `site_web`, `description`, `pays` (code ISO 2 lettres), `ville`, `secteur`, `analyse` (jsonb, résultat du module 06), `analyse_le`, `style_valide` (bool, défaut false), `nom_signature` (ex. « Koffi, du Studio Koffi »), `whatsapp_notification`, `fuseau_horaire` (défaut `Africa/Porto-Novo`), `premier_achat_fait` (bool)
- `membres` : `entreprise_id`, `profil_id`, `role`. Unique (`entreprise_id`, `profil_id`)
- Fonction SQL `est_membre(entreprise uuid) returns boolean` (`security definer`, `stable`, `search_path` fixé) : utilisée par toutes les politiques RLS

## Migration 3 : ciblage et campagnes
- `profils_cibles` : `entreprise_id`, `nom`, `type_cible`, `secteurs text[]`, `tailles text[]`, `pays text[]`, `villes text[]`, `signaux_achat text[]`, `angle` (l'argument principal), `actif` bool
- `campagnes` : `entreprise_id`, `profil_cible_id`, `nom`, `statut`, `canaux_autorises canal[]`, `mode_repartition`, `repartition` jsonb (ex. `{"email":40,"whatsapp":60}` en %), `plafond_credits_jour` integer, `sequence` jsonb (étapes : jour, canal, objectif), `demarree_le`, `terminee_le`

## Migration 4 : annuaire
**Ne pas la faire ici.** Tout l'annuaire (entreprises, lieux, contacts, sources, particuliers, imports des clients) est créé par le module **07A**. Les tables de ce module qui font référence à l'annuaire (`prospects.annuaire_entreprise_id`, `prospects.annuaire_contact_id`) reçoivent leur clé étrangère dans une migration du module 07A.

## Migration 5 : prospects et messages (par client)
- `prospects` : `entreprise_id`, `campagne_id`, `annuaire_entreprise_id` (nullable), `annuaire_contact_id` (nullable), `type_cible`, `nom_entreprise`, `nom_contact`, `poste`, `email`, `telephone`, `whatsapp`, `pays`, `langue`, `score_adequation` smallint (0–100), `analyse` jsonb (module 08), `canal_prefere` canal, `statut`, `source`, `base_legale`. Unique (`campagne_id`, `annuaire_entreprise_id`)
- `messages` : `entreprise_id`, `prospect_id`, `campagne_id`, `canal`, `sens`, `statut`, `etape_sequence` smallint, `sujet`, `corps`, `id_externe`, `boite_envoi_id` (nullable), `numero_djeli_id` (nullable), `planifie_pour`, `envoye_le`, `erreur`, `credits_debites` integer, `classe` classe_reponse (entrants), `piece_jointe_url`. Unique (`canal`, `id_externe`) quand non nul
- `conversations` : une ligne par (`prospect_id`, `canal`), `dernier_message_le`, `fenetre_24h_jusqua` (WhatsApp), `en_attente_client` bool
- `rendez_vous` : `entreprise_id`, `prospect_id`, `debut`, `fin`, `lieu_ou_lien`, `google_event_id`, `statut` (`propose`, `confirme`, `annule`, `honore`, `non_venu`), `rappel_envoye` bool
- `integrations` : `entreprise_id`, `type` (`google_agenda`), `jeton_ref` (référence chiffrée, jamais le jeton en clair), `actif`

## Migration 6 : crédits (tables seulement, la logique est au module 03)
- `soldes_credits` : `entreprise_id` (unique), `solde` integer not null default 0 check (`solde >= 0`), `alerte_20_envoyee` bool, `alerte_5_envoyee` bool, `reference_alerte` integer (solde au dernier achat, pour calculer les 20 % et 5 %)
- `transactions_credits` : `entreprise_id`, `type`, `montant` integer (positif = ajout, négatif = débit), `solde_apres` integer, `motif`, `reference`, `cle_idempotence` texte unique, `expire_le` (achats : + 12 mois)
- `depenses_jour` : `entreprise_id`, `campagne_id`, `jour` date, `canal`, `credits` integer. Unique (`campagne_id`, `jour`, `canal`) : sert au plafond par jour
- `paiements` : `entreprise_id`, `prestataire`, `montant_fcfa` integer, `credits` integer, `bonus` integer, `statut` (`en_attente`, `reussi`, `echoue`, `rembourse`), `reference_externe` unique, `telephone_payeur`, `operateur`, `brut` jsonb

## Migration 7 : envoi et conformité (globales)
- `opt_outs` : `valeur` citext unique (email ou téléphone en E.164), `canal`, `raison`. **Global à tous les clients** : quelqu'un qui dit STOP n'est plus jamais contacté par Djeli
- `boites_envoi` : `adresse`, `domaine`, `fournisseur`, `quota_jour`, `envoyes_aujourdhui`, `sante` smallint, `en_pause` bool, `raison_pause`, `identifiants_ref` (nom du secret, **jamais le mot de passe en clair**)
- `numeros_djeli` : `canal` (`whatsapp` ou `sms`), `pays`, `numero_e164`, `id_fournisseur`, `note_qualite`, `limite_jour`, `envoyes_aujourdhui`, `en_pause`
- `contacts_recents` : `valeur` citext unique, `dernier_premier_message_le` : règle « 1 premier message Djeli maximum par prospect et par semaine, tous clients confondus »
- `jours_feries` : `pays`, `jour`, `nom`
- `journal_evenements` : `entreprise_id` (nullable), `type`, `donnees` jsonb

## Migration 8 : RLS
- Activer la RLS sur **toutes** les tables
- Tables d'un client (`entreprises`, `membres`, `profils_cibles`, `campagnes`, `prospects`, `messages`, `conversations`, `rendez_vous`, `integrations`, `soldes_credits`, `transactions_credits`, `depenses_jour`, `paiements`) : `select` si `est_membre(entreprise_id)`
- Écriture par le client seulement sur : `entreprises` (ses champs de profil), `profils_cibles`, `campagnes`, `rendez_vous`
- **Aucune écriture client** sur `soldes_credits`, `transactions_credits`, `depenses_jour`, `paiements`, `messages`, `integrations`
- `profils` : chacun lit et modifie le sien
- `opt_outs`, `boites_envoi`, `numeros_djeli`, `contacts_recents`, `journal_evenements` : **aucun accès** pour `anon` et `authenticated`

## Tests (pgTAP dans `supabase/tests/` ou Vitest sur la base locale)
- L'utilisateur A ne voit pas les prospects de l'entreprise B
- Un utilisateur connecté ne peut pas écrire dans `transactions_credits`
- Un utilisateur connecté ne peut pas lire `opt_outs` ni `boites_envoi`
- `solde` ne peut pas devenir négatif

## Critères d'acceptation
- [ ] `npm run db:reset` applique tout sans erreur
- [ ] `database.types.ts` généré et commité
- [ ] Les 4 tests de sécurité passent
