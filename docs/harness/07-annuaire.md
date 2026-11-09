# Module 07 : l'annuaire des entreprises d'Afrique de l'Ouest

## Objectif
Construire notre base d'entreprises à partir de sources ouvertes, la dédoublonner, la charger dans Postgres et permettre une recherche rapide par secteur, pays, ville et distance.

## Prérequis
Module 02 terminé.

## Pays couverts
Bénin (BJ), Burkina Faso (BF), Cap-Vert (CV), Côte d'Ivoire (CI), Gambie (GM), Ghana (GH), Guinée (GN), Guinée-Bissau (GW), Liberia (LR), Mali (ML), Mauritanie (MR), Niger (NE), Nigeria (NG), Sénégal (SN), Sierra Leone (SL), Togo (TG). Liste dans `src/lib/donnees/pays.ts`.

## Sources de cette étape (les autres viendront ensuite, une par une)
1. **Overture Maps Places** (Parquet, licence permissive) : lecture directe sur S3 avec DuckDB
2. **Foursquare OS Places** (Parquet, Apache 2.0)
3. **OpenStreetMap** (extrait Geofabrik Afrique de l'Ouest, `.osm.pbf`) : objets avec `shop`, `office`, `amenity`, `craft`, `industrial`. Licence ODbL : garder la mention de la source dans `sources`
4. **Import CSV par le client** (ses propres fichiers) : rattaché à son entreprise, jamais ajouté à l'annuaire partagé

**Google Maps** : seulement à la demande, plus tard, et on ne stocke que `google_place_id`. Hors de ce module.

## À faire

### 1. Scripts `scripts/annuaire/` (Node + `@duckdb/node-api`, lancés à la main)
- `01-telecharger.ts` : récupère Overture et Foursquare filtrés sur la zone (boîte géographique de l'Afrique de l'Ouest, puis filtre sur le code pays) vers `data/brut/*.parquet` (dossier ignoré par git)
- `02-normaliser.ts` : met chaque source au même format : `nom`, `nom_normalise` (minuscules, sans accents, sans « SARL », « SA », « Ets », « Sté »…), `categorie` (table de correspondance vers **notre** liste de catégories, `src/lib/donnees/categories.ts`, environ 80 catégories en français), `pays`, `ville`, `adresse`, `lat`, `lon`, `site_web` (domaine nettoyé), `telephone` (E.164), `email`, `reseaux`, `source`, `id_source`
- `03-dedoublonner.ts` : regroupe les doublons entre sources :
  - même domaine de site web → même entreprise
  - même téléphone → même entreprise
  - nom très proche (similarité trigram > 0,8) **et** distance < 150 m → même entreprise
  - fusion : garder la valeur la plus complète de chaque champ, réunir `sources` et `ids_sources`
  - `score_qualite` (0–100) : présence de site, téléphone, email, catégorie précise, nombre de sources
- `04-charger.ts` : écrit dans `annuaire_entreprises` par lots de 5 000 avec `COPY` ou `upsert` sur une clé stable ; rapport final (nombre par pays et par catégorie)
- `README.md` dans `scripts/annuaire/` : comment lancer chaque script, en français simple

### 2. Recherche `src/lib/donnees/recherche.ts`
- `chercherEntreprises({ categories[], pays[], villes[], centre?, rayonKm?, tailles[], exclureIds[], limite, curseur })`
- Fonction SQL `chercher_annuaire(...)` qui utilise les index (GIST, trigram)
- Exclut : les entreprises dont tous les contacts sont dans `opt_outs`, celles déjà prospects de **cette** campagne
- `compterEntreprises(filtres)` pour l'aperçu du module 06 (remplace la fonction temporaire)
- Moins de 500 ms pour 1 million de lignes (vérifier avec `explain analyze`)

### 3. Enrichissement léger (tâche Trigger.dev `src/trigger/enrichir-annuaire.ts`)
- Pour les entreprises avec un site mais sans email : lecture du site (module 06, `lireSite`) pour trouver un email **générique** (contact@, info@…) et le lien WhatsApp affiché
- 1 requête par seconde par domaine au maximum, `robots.txt` respecté
- Met à jour `verifie_le`

## Ce qu'il ne faut pas faire
- Pas de scraping de pages qui demandent une connexion (Facebook, LinkedIn, Instagram…)
- Pas de récupération d'emails personnels devinés (prenom.nom@) dans ce module

## Critères d'acceptation
- [ ] Les 4 scripts tournent de bout en bout sur au moins le Bénin et le Sénégal
- [ ] Rapport : nombre d'entreprises par pays, taux de doublons fusionnés, part avec téléphone, avec site, avec email
- [ ] La recherche « restaurants à Cotonou » renvoie des résultats en moins de 500 ms
