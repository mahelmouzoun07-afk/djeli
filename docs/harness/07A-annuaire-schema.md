# Module 07A : le schéma de l'annuaire

## Objectif
Créer les tables qui accueillent **toutes** les sources de `docs/sources/REGISTRE-DES-SOURCES.md`. L'annuaire n'est pas une simple liste : c'est un **graphe** d'entreprises, de lieux, de contacts, de listes officielles, de marchés, de présence web et de signaux, où chaque information garde **sa source**.

Ce module **remplace la migration 4 du module 02** (anciennes tables `annuaire_entreprises`, `annuaire_contacts`, `annuaire_particuliers_importes`). Si le module 02 les a déjà créées, écris une migration qui les fait évoluer vers ce schéma, sans supprimer de données.

## Prérequis
Modules 01 et 02 terminés.

## Principes
1. **Entreprise ≠ lieu.** Une entreprise (entité légale ou commerciale) peut avoir plusieurs lieux (agences, boutiques). Un lieu peut exister sans entreprise identifiée.
2. **Provenance champ par champ.** Pour chaque valeur (téléphone, site…), on sait quelle source l'a donnée et quand. On peut ainsi retirer d'un coup tout ce qui vient d'une source.
3. **Rien n'est montré aux clients directement.** Toutes les tables de l'annuaire sont réservées au service. Les clients y accèdent seulement par les fonctions de recherche (module 08).
4. **Personnes : le minimum, et toujours une base légale.**
5. Noms de tables et colonnes en français, en `snake_case`, comme le reste du projet.

## Migration 1 : types
- `couche_source` : `lieux`, `identite_legale`, `liste_sectorielle`, `marches`, `web`, `reseaux`, `annuaires_tiers`, `proprietaire`, `statistiques`
- `type_source` : `open_data`, `api_officielle`, `registre_officiel`, `publication_officielle`, `annuaire`, `marketplace`, `emploi`, `presse`, `reseau_social`, `client`, `partenaire`, `terrain`, `formulaire`
- `methode_acces` : `telechargement`, `api`, `recherche_unitaire`, `import_document`, `saisie_manuelle`, `formulaire`, `partenariat`
- `statut_juridique` : `autorise`, `sous_conditions`, `interdit`
- `statut_verification` : `non_verifie`, `recoupe` (au moins 2 sources indépendantes), `verifie_registre`, `verifie_site`, `verifie_terrain`, `verifie_proprietaire` (l'entreprise elle-même)
- `statut_activite` : `active`, `fermee`, `radiee`, `inconnue`
- `etat_consentement` : `inconnu`, `accorde`, `refuse`, `retire`
- `type_signal` : `nouveau_site`, `nouvelle_entreprise`, `changement_dirigeant`, `marche_attribue`, `acheteur_public`, `recrute`, `fait_de_la_pub`, `a_une_appli`, `vend_en_ligne`, `exposant_salon`, `membre_chambre`, `levee_de_fonds`, `cotee_en_bourse`, `inscrite_annuaire`, `fermeture`

## Migration 2 : les sources et leur suivi
- `sources` : `code` (unique, celui du registre), `nom`, `couche`, `type`, `url`, `pays text[]`, `licence`, `attribution` (mention obligatoire, ex. « © contributeurs OpenStreetMap »), `methode_acces`, `statut_juridique`, `conditions` (texte), `conditions_remplies` bool (coché par un humain, défaut false), `partage_autorise` bool (peut-on montrer cette donnée à un client ?), `fiabilite` smallint 0–100, `frequence_sync` interval, `derniere_sync`, `actif` bool (défaut false), `notes`
- `synchronisations` : `source_id`, `debut`, `fin`, `statut` (`en_cours`, `reussie`, `echouee`, `annulee`), `parametres` jsonb, `lus`, `crees`, `mis_a_jour`, `inchanges`, `rejetes`, `erreur`
- `enregistrements_bruts` : `source_id`, `synchronisation_id`, `id_externe`, `pays`, `donnees` jsonb (seulement les champs utiles, pas l'objet complet), `empreinte` (hash du contenu, pour sauter ce qui n'a pas changé), `recu_le`, `traite_le`, `rejete_raison`. Unique (`source_id`, `id_externe`). Index sur (`source_id`, `traite_le`)
- **Seed** : une migration `seed_sources.sql` insère toutes les lignes du registre, avec les bons statuts. `actif = true` seulement pour les sources 🟢 de la vague 1.

## Migration 3 : référentiels
- `pays_couverts` : `code` ISO, `nom`, `indicatif`, `fuseau_horaire`, `domaine_national` (`.bj`…), `identifiant_fiscal` (nom local : IFU, NINEA, NCC…), `regex_identifiant_fiscal`, `regex_rccm`
- `villes` : `pays`, `nom`, `nom_normalise`, `alias text[]` (ex. « Abidjan » / « Abj »), `position`, `population`, `region`
- `categories` : `code`, `nom`, `parent_code`, `description` : **notre** taxonomie (environ 80 catégories, 2 niveaux), fichier source `src/lib/donnees/categories.ts`
- `correspondances_categories` : `source_code`, `categorie_source`, `categorie_code`, `confiance`. Unique (`source_code`, `categorie_source`)

## Migration 4 : le cœur
- `annuaire_entreprises` : `nom_legal`, `nom_commercial`, `nom_normalise`, `forme_juridique`, `numero_rccm`, `identifiant_fiscal`, `lei`, `wikidata_id`, `opencorporates_id`, `pays`, `ville`, `adresse_siege`, `categorie_code`, `activites text[]`, `statut_activite`, `date_creation`, `tranche_effectif` (`1`, `2-9`, `10-49`, `50-249`, `250+`), `site_web`, `domaine`, `email_generique`, `telephone`, `whatsapp`, `score_qualite` smallint, `score_confiance` smallint, `statut_verification`, `verifie_le`, `sources text[]`, `fusionnee_dans` (uuid, si fusionnée avec un doublon)
  - Uniques partiels (quand non nuls) : (`pays`, `numero_rccm`), (`pays`, `identifiant_fiscal`), `lei`, `wikidata_id`
  - Index : GIN trigram sur `nom_normalise`, btree sur (`pays`, `categorie_code`), (`pays`, `ville`), `domaine`, `telephone`
- `annuaire_lieux` : `entreprise_id` (nullable), `nom`, `nom_normalise`, `categorie_code`, `adresse`, `quartier`, `ville`, `pays`, `position geography(Point,4326)`, `telephone`, `site_web`, `horaires` jsonb, `statut_activite`, `confiance` smallint, `overture_id`, `foursquare_id`, `osm_id` (ex. `node/123`), `google_place_id`, `sources text[]`, `fusionne_dans`
  - Uniques partiels sur chaque identifiant externe. Index GIST sur `position`, trigram sur `nom_normalise`
- `annuaire_contacts` : `entreprise_id`, `type` (`generique` ou `nominatif`), `nom_complet`, `fonction`, `email`, `telephone`, `lien_linkedin`, `source_code`, `base_legale` (texte obligatoire pour un contact nominatif : « dirigeant publié au journal officiel », « affiché sur le site de l'entreprise », « consentement »…), `consentement` etat_consentement, `verifie_le`
  - Contrainte : `type = 'nominatif'` exige `base_legale` non vide
- `provenances` : `entite_type` (`entreprise`, `lieu`, `contact`), `entite_id`, `champ`, `valeur` text, `source_code`, `enregistrement_brut_id`, `observe_le`, `confiance` smallint, `retenue` bool (la valeur affichée est celle-ci). Index (`entite_type`, `entite_id`, `champ`) et (`source_code`)
- `relations_entreprises` : `parent_id`, `enfant_id`, `type` (`filiale`, `succursale`, `franchise`), `source_code`
- `rapprochements_a_verifier` : `entite_type`, `id_a`, `id_b`, `score`, `raisons` jsonb, `decision` (`en_attente`, `meme`, `different`), `decide_par`, `decide_le`

## Migration 5 : les couches d'information
- `listes_sectorielles` : `source_code`, `nom`, `secteur`, `pays`, `emetteur`, `url`, `licence`, `date_publication`, `importee_le`, `document_url` (copie dans le stockage), `empreinte_document`
- `listes_sectorielles_membres` : `liste_id`, `nom_brut`, `numero_agrement`, `ville_brute`, `donnees` jsonb, `entreprise_id` (nullable), `rapprochement` (`auto`, `manuel`, `non_trouve`)
- `marches_publics` : `source_code`, `reference`, `pays`, `acheteur_nom`, `acheteur_entreprise_id`, `attributaire_nom`, `attributaire_entreprise_id`, `objet`, `secteur`, `montant` numeric, `devise`, `date_attribution`, `url_source`. Unique (`source_code`, `reference`, `attributaire_nom`)
- `presence_numerique` : `entreprise_id` (unique), `domaine`, `site_actif` bool, `derniere_visite`, `domaine_cree_le`, `premier_certificat_le`, `rang_tranco`, `crux_present` bool, `technologies text[]`, `paiements_en_ligne text[]`, `reseaux` jsonb (liens trouvés : facebook, instagram, linkedin, tiktok, youtube, x, telegram), `whatsapp_lien`, `applis` jsonb (stores et liens), `donnees_youtube` jsonb + `donnees_youtube_expire_le`
- `signaux` : `entreprise_id`, `type` type_signal, `source_code`, `detail` jsonb, `observe_le`, `expire_le`. Index (`entreprise_id`, `type`) et (`type`, `observe_le`)
- `evenements` : `nom`, `type` (`salon`, `foire`, `conference`), `ville`, `pays`, `debut`, `fin`, `url`
- `evenements_participants` : `evenement_id`, `entreprise_id`, `role` (`exposant`, `sponsor`, `intervenant`)

## Migration 6 : nos sources et les personnes
- `inscriptions_annuaire` : fiche déposée par une entreprise : `entreprise_id`, `nom_declarant`, `telephone_verifie` bool, `email_verifie` bool, `visible_annuaire` bool, `accepte_contact_clients` bool, `besoin` texte, `preuve_consentement` jsonb (version du formulaire, date, empreinte de l'IP), `jeton_gestion` (lien magique pour modifier ou supprimer)
- `imports_clients` : `entreprise_cliente_id`, `nom_fichier`, `lignes`, `importees`, `rejetees`, `correspondance_colonnes` jsonb, `cree_le`
- `contacts_importes` : `entreprise_cliente_id`, `import_id`, `type_cible` (`entreprise` ou `particulier`), `nom_entreprise`, `nom_complet`, `email`, `telephone`, `ville`, `pays`, `donnees` jsonb, `annuaire_entreprise_id` (rapprochement en lecture seule), `base_legale`. **Visible uniquement par le client qui l'a importé** (RLS sur `est_membre(entreprise_cliente_id)`) ; jamais copié dans l'annuaire partagé
- `ambassadeurs` : `profil_id`, `pays`, `villes text[]`, `actif`, `fiches_validees`, `taux_qualite`
- `missions_terrain` : `ambassadeur_id`, `zone` (ville, quartier), `statut`, `cree_le`, `fin_prevue`
- `visites_terrain` : `mission_id`, `lieu_id` ou `entreprise_id`, `resultat` (`existe`, `fermee`, `demenagee`, `introuvable`), `telephone_confirme`, `photo_url` (stockage privé), `accord_contact` bool, `position_releve`, `releve_le`, `controle` (`a_controler`, `valide`, `refuse`)
- `partenaires` : `nom`, `type`, `accord_reference`, `accord_signe_le`, `partage_autorise` bool, `contact_interne`
- `particuliers` : seulement s'ils ont donné leur accord (formulaire, parrainage accepté, partenaire avec accord) : `prenom`, `nom`, `pseudonyme`, `pays`, `ville`, `langue`, `telephone`, `whatsapp`, `email`, `activite`, `besoin`, `origine` (`formulaire`, `parrainage`, `partenaire`), `partenaire_id`. **Interdit** : pièce d'identité, date de naissance complète, position précise, données de santé ou de religion
- `consentements` : `personne_type` (`particulier`, `contact`, `inscription`), `personne_id`, `finalite` (`etre_dans_annuaire`, `prospection_par_clients_djeli`, `nouvelles_djeli`, `partage_partenaire`), `canal`, `accorde_le`, `retire_le`, `preuve` jsonb, `base_legale`
- `profils_createurs` : `plateforme`, `identifiant`, `url`, `niche`, `abonnes`, `pays`, `ville`, `source_code`, `observe_le`, `expire_le`, `particulier_id` (nullable : seulement si la personne s'est inscrite)
- `communautes` : `plateforme`, `nom`, `sujet`, `ville`, `pays`, `taille`, `url`, `source_code` (jamais la liste des membres)
- `parrainages` : `parrain_type`, `parrain_id`, `filleul_particulier_id`, `statut` (`invite`, `accepte`, `refuse`), `recompense`
- `statistiques_zones` : `pays`, `region`, `ville`, `indicateur`, `valeur` numeric, `unite`, `annee`, `source_code`
- `demandes_suppression` : `valeur` (email ou téléphone), `type_demande` (`suppression`, `rectification`, `opposition`), `recue_le`, `traitee_le`, `statut`, `notes`

## Migration 7 : sécurité (RLS)
- RLS activée partout
- Réservé au service (aucun accès `anon` ni `authenticated`) : toutes les tables ci-dessus **sauf** :
  - `contacts_importes`, `imports_clients` : lecture et écriture par les membres de l'entreprise cliente
  - `visites_terrain`, `missions_terrain` : un ambassadeur lit et écrit seulement ses propres missions
- Rôle administrateur : colonne `profils.est_admin` (défaut false) et fonction `est_admin()` ; les admins lisent tout l'annuaire (pour la relecture des rapprochements et des imports)

## Migration 8 : fonctions de base
- `normaliser_nom(texte)` en SQL (minuscules, sans accents, sans formes juridiques : SARL, SARLU, SA, SAS, SASU, GIE, ETS, STE, SCI, LTD, PLC, LLC… ; sans ponctuation ni espaces multiples). La même fonction existe en TypeScript dans `src/lib/donnees/normaliser.ts` et les deux sont testées sur les mêmes exemples
- `chercher_annuaire(...)` et `compter_annuaire(...)` : mêmes paramètres que prévu au module 07 (catégories, pays, villes, centre, rayon, tailles) + nouveaux filtres `signaux type_signal[]`, `statut_verification_min`, `avec_contact canal[]`. Exclut les fiches `fermee`, `radiee`, fusionnées, et celles dont tous les contacts sont dans `opt_outs`

## Tests
- Un contact `nominatif` sans `base_legale` est refusé par la base
- Un client ne lit pas les `contacts_importes` d'un autre client
- Un utilisateur connecté non admin ne lit aucune table de l'annuaire
- `normaliser_nom('Ets KOFFI & Fils SARL')` = `koffi fils` en SQL et en TypeScript
- Le seed contient toutes les sources du registre, et aucune source 🔴 n'est `actif`

## Critères d'acceptation
- [ ] `npm run db:reset` passe, `database.types.ts` régénéré
- [ ] Les fonctions `chercher_annuaire` et `compter_annuaire` répondent (vides pour l'instant)
- [ ] Les tests passent
