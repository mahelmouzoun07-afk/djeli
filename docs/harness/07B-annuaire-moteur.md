# Module 07B : le moteur d'ingestion et de rapprochement

## Objectif
Un seul moteur, utilisé par **toutes** les sources : lire → normaliser → rapprocher → fusionner → tracer. Chaque nouvelle source ne demande ensuite qu'un petit « connecteur ».

## Prérequis
Module 07A terminé.

## À faire

### 1. L'interface d'un connecteur `src/lib/donnees/ingestion/connecteur.ts`
```ts
interface Connecteur {
  code: string;                      // = sources.code
  lire(params: ParametresSync): AsyncIterable<EnregistrementBrut>;   // { idExterne, pays, donnees }
  normaliser(brut: EnregistrementBrut): FicheNormalisee[];           // 0, 1 ou plusieurs fiches
}
type FicheNormalisee =
  | { genre: 'entreprise'; champs: ChampsEntreprise; identifiants: Identifiants }
  | { genre: 'lieu'; champs: ChampsLieu; identifiants: Identifiants }
  | { genre: 'contact'; champs: ChampsContact; rattachement: Identifiants }
  | { genre: 'signal'; type: TypeSignal; detail: object; rattachement: Identifiants }
  | { genre: 'membre_liste' | 'marche' | 'presence' | 'statistique' | 'createur' | 'communaute'; ... };
```
- Un fichier par source : `src/lib/donnees/connecteurs/<code>.ts`
- Registre des connecteurs : `src/lib/donnees/connecteurs/index.ts`

### 2. Deux façons de lancer une synchronisation
- **Gros fichiers** (Overture, Foursquare, OSM, GLEIF, Common Crawl) : script `scripts/annuaire/sync.ts --source=<code> --pays=BJ,SN` lancé à la main sur ton ordinateur (DuckDB, lecture en flux, écriture par lots de 5 000)
- **API et documents** : tâche Trigger.dev `src/trigger/sync-source.ts` (paramètre `code`), planifiée selon `sources.frequence_sync`

### 3. La garde juridique `src/lib/donnees/ingestion/garde-source.ts`
Avant toute lecture, refuser si :
- `sources.actif = false`
- `statut_juridique = 'interdit'`
- `statut_juridique = 'sous_conditions'` et `conditions_remplies = false`

Message clair dans `synchronisations.erreur`. Aucun moyen de contourner cette garde par un paramètre.

### 4. La politesse réseau `src/lib/donnees/ingestion/reseau.ts`
- Un seul client HTTP pour tous les connecteurs : User-Agent `DjeliBot/1.0 (+https://djeliai.com/robot)`, `robots.txt` respecté (en cache 24 h), limite par domaine (1 requête par seconde par défaut, réglable par source), délai de 15 s, 3 nouvelles tentatives avec attente croissante, arrêt sur 429 en respectant `Retry-After`

### 5. Normalisation commune `src/lib/donnees/normaliser.ts`
- `normaliserNom` (identique à la fonction SQL du module 07A)
- `normaliserTelephone(brut, pays)` → E.164 (`libphonenumber-js`) ; distinguer fixe et mobile
- `normaliserDomaine(url)` → domaine enregistrable (`tldts`), sans `www`
- `normaliserEmail` ; `estEmailGenerique` (contact@, info@, hello@, commercial@, sales@…)
- `normaliserVille(brut, pays)` → ville du référentiel `villes` (alias compris)
- `categorieDepuisSource(source, categorieSource)` → notre catégorie, via `correspondances_categories` ; si inconnue : catégorie `a_classer` + enregistrement dans un rapport pour compléter la table
- `extraireIdentifiants(texte, pays)` : RCCM et identifiant fiscal par expressions régulières de `pays_couverts`

### 6. Rapprochement (savoir si deux fiches parlent de la même chose) `src/lib/donnees/ingestion/rapprocher.ts`
En cascade, on s'arrête à la première règle qui répond :
1. **Identifiant fort identique** → même entité : RCCM + pays, identifiant fiscal + pays, LEI, Wikidata, `overture_id`, `foursquare_id`, `osm_id`, `google_place_id`
2. **Même domaine de site** → même entreprise (sauf domaines partagés : `facebook.com`, `wixsite.com`, `blogspot.com`, `linktr.ee`…, liste dans `domaines-partages.ts`)
3. **Même téléphone** → même entité, sauf si le numéro est partagé par plus de 5 fiches (standard d'un centre commercial, par exemple)
4. **Nom proche** (similarité trigram ≥ 0,8) **et** distance < 150 m → même lieu
5. **Nom très proche** (≥ 0,9) **et** même ville, pour les sources sans coordonnées (registres, listes)
- Score entre 0,6 et la règle d'acceptation → ligne dans `rapprochements_a_verifier`, pas de fusion automatique
- Lieu → entreprise : un lieu est rattaché à une entreprise si identifiant, domaine ou téléphone commun, ou nom proche dans la même ville

### 7. Fusion `src/lib/donnees/ingestion/fusionner.ts`
- Pour chaque champ, écrire une ligne dans `provenances`, puis choisir la valeur `retenue` selon cet ordre :
  1. donnée déclarée par l'entreprise elle-même (`inscription_annuaire`) ou vérifiée sur le terrain
  2. registre officiel ou journal officiel
  3. liste sectorielle officielle
  4. site officiel de l'entreprise
  5. données ouvertes (Overture, Foursquare, OSM, GLEIF, Wikidata)
  6. autres sources
  - à rang égal : la plus récente, puis la plus fiable (`sources.fiabilite`)
- **Jamais** remplacer une valeur `verifie_proprietaire` ou `verifie_terrain` par une source automatique
- Fusion de deux doublons : on garde la plus ancienne, l'autre reçoit `fusionnee_dans`, toutes les références (lieux, contacts, signaux, prospects) sont reportées
- Mettre à jour `sources text[]`, `statut_verification` (`recoupe` dès 2 sources indépendantes), et recalculer les scores (module 07H)

### 8. Retirer une source `scripts/annuaire/retirer-source.ts --source=<code>`
Supprime toutes les provenances de cette source, recalcule les valeurs retenues, supprime les fiches qui n'avaient que cette source. Indispensable si une licence change.

### 9. Relecture humaine (Server Actions réservées aux admins) `src/app/(app)/admin/annuaire/actions.ts`
- `listerRapprochementsAVerifier({ page })`, `deciderRapprochement({ id, decision })`
- `statistiquesSynchronisations()` : dernières synchronisations par source, avec leurs compteurs

## Tests (avec des fiches d'exemple dans `tests/fixtures/annuaire/`)
- Deux fiches Overture et Foursquare du même restaurant à 40 m avec des noms proches → fusionnées
- Même nom, deux villes différentes → pas fusionnées
- Deux entreprises qui partagent le téléphone d'un centre commercial → pas fusionnées
- Une source 🟡 sans `conditions_remplies` → la synchronisation refuse de démarrer
- Une valeur vérifiée par l'entreprise n'est pas écrasée par Overture
- `retirer-source` supprime bien toutes les valeurs de la source et seulement elles
- Une synchronisation relancée sur les mêmes données ne crée rien (tout est `inchanges`)

## Critères d'acceptation
- [ ] Un connecteur de démonstration (fichier CSV de 50 lignes dans les fixtures) passe toute la chaîne
- [ ] Les tests passent
