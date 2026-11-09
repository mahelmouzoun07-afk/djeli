# Module 07C : vague 1, le socle des lieux et des identifiants mondiaux

## Objectif
Remplir l'annuaire avec les lieux d'Afrique de l'Ouest à partir des sources ouvertes, ajouter les identifiants mondiaux gratuits (GLEIF, Wikidata), et préparer Google Places et le géocodage pour plus tard.

## Prérequis
Module 07B terminé. Environ 20 Go libres sur le disque. Docker lancé.

## Règle
Pour chaque source, **lis d'abord sa documentation officielle actuelle** (nom des colonnes, version, conditions). Les formats changent d'une version à l'autre. Épingle la version utilisée dans une variable d'environnement et écris-la dans `synchronisations.parametres`.

## Connecteurs à écrire (`src/lib/donnees/connecteurs/`)

### `overture.ts` (script, DuckDB)
- Lecture directe des fichiers Parquet du thème `places` de la version épinglée (`OVERTURE_RELEASE`), filtrée d'abord par la boîte géographique de l'Afrique de l'Ouest, puis par code pays de l'adresse
- Champs : identifiant, nom principal, catégories, score de confiance, sites, réseaux, emails, téléphones, adresses, marque, position
- Garder les lieux de confiance ≥ 0,4 ; stocker la confiance dans `annuaire_lieux.confiance`
- Les emails trouvés : seulement les génériques vont dans `email_generique` ; les autres deviennent des contacts `nominatif` avec `base_legale = 'publié dans Overture (source ouverte)'`, `consentement = 'inconnu'`

### `foursquare_os.ts` (script, DuckDB)
- Fichiers Parquet téléchargés depuis le portail officiel (version dans `FOURSQUARE_OS_RELEASE`)
- Champs : identifiant, nom, position, adresse, ville, région, pays, téléphone, site, email, identifiants Facebook / Instagram / X, catégories, dates de création, de mise à jour et **de fermeture**
- Date de fermeture renseignée → `statut_activite = 'fermee'` + signal `fermeture`

### `osm.ts` (script, DuckDB avec l'extension `spatial`, ou `osmium`)
- Extraits Geofabrik par pays (liste des pays dans `pays_couverts`)
- Objets gardés : tags `shop`, `office`, `craft`, `amenity` (restaurant, cafe, bar, pharmacy, clinic, hospital, dentist, doctors, school, college, university, bank, fuel, car_wash…), `tourism` (hotel, guest_house), `healthcare`, `industrial`, `man_made=works`
- Pour les surfaces (bâtiments), prendre le point central
- Tags utiles : `name`, `brand`, `operator`, `phone`, `contact:phone`, `website`, `contact:website`, `email`, `contact:email`, `addr:*`, `opening_hours`, `contact:facebook`, `contact:instagram`, `disused:*` (→ fermé)
- Provenance `osm` sur chaque valeur (obligation ODbL de pouvoir les isoler)

### `overpass.ts` (tâche Trigger.dev)
- Requête par ville et par catégorie, pour combler une zone mal couverte. Serveur configurable (`OVERPASS_URL`) ; maximum 1 requête toutes les 10 s sur un serveur public

### `gleif.ts` (script)
- Fichier complet « golden copy » (LEI niveau 1) + relations (niveau 2)
- Filtre : pays de l'adresse légale ou du siège dans `pays_couverts`
- Champs : LEI, nom légal, forme, statut, autorité d'enregistrement et numéro (souvent le RCCM), adresses → `annuaire_entreprises` ; relations → `relations_entreprises`
- Statut « LAPSED » ne veut pas dire fermée : garder `statut_activite = 'inconnue'`

### `wikidata.ts` (tâche Trigger.dev)
- Requêtes SPARQL par pays : entités qui sont des entreprises ou organisations commerciales (sous-classes comprises), avec pays = un pays couvert
- Propriétés : libellé, site officiel, LEI, identifiant OpenCorporates, date de création, siège, secteur, identifiants Facebook / Instagram / LinkedIn / X
- Respecter les règles du service : User-Agent explicite, requêtes découpées pour rester sous le délai maximal

### `google_places.ts` (à la demande, jamais en masse)
- `trouverPlaceId(entrepriseId)` : recherche texte (nom + ville), ne **stocke que** `google_place_id`
- `lireFicheGoogle(entrepriseId)` : demande la fiche au moment du besoin (analyse d'un prospect, module 08) ; le résultat n'est **jamais** écrit dans l'annuaire ni dans `provenances` ; cache en mémoire de la tâche seulement
- Plafond de dépense quotidien `GOOGLE_PLACES_BUDGET_JOUR` (en dollars) ; au-delà, refus et alerte

### Géocodage `src/lib/donnees/geocodage/`
- Interface `Geocodeur { geocoder(adresse, ville, pays) }`
- Implémentation `mapbox.ts` en mode **permanent** (le seul qui autorise de garder le résultat), **désactivée** tant que la source `mapbox_geo` n'a pas `conditions_remplies`
- Utilisé pour les fiches sans coordonnées (registres, listes officielles)

## Catégories
- Compléter `src/lib/donnees/categories.ts` (environ 80 catégories, 2 niveaux, en français)
- Remplir `correspondances_categories` pour Overture, Foursquare et OSM (fichiers `src/lib/donnees/categories/correspondances/*.ts`), puis afficher le rapport des catégories `a_classer` les plus fréquentes

## Ordre de lancement
1. Bénin et Sénégal seulement, pour vérifier
2. Revue du rapport (section suivante) avec l'architecte
3. Puis tous les pays de `pays_couverts`

## Rapport attendu à la fin (`docs/sources/rapport-vague-1.md`, produit par un script)
Par pays : nombre de lieux par source, nombre après fusion, part avec téléphone, site, email, part recoupée par au moins 2 sources, 20 catégories les plus fréquentes, nombre de rapprochements à vérifier.

## Critères d'acceptation
- [ ] Les 5 connecteurs de données ouvertes tournent de bout en bout sur le Bénin et le Sénégal
- [ ] Relancer une synchronisation ne crée pas de doublons
- [ ] `google_places.ts` ne peut pas écrire autre chose que `google_place_id` (test)
- [ ] « Pharmacies à Cotonou » via `chercher_annuaire` répond en moins de 500 ms
