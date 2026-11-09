# Module 07E : vague 3, listes officielles, marchés publics et réseaux d'affaires

## Objectif
Ajouter les segments les plus fiables (banques, assurances, cliniques, écoles…) et repérer les entreprises **qui ont du budget** : celles qui gagnent des marchés publics, sont cotées, exposent dans les salons ou appartiennent aux chambres de commerce.

## Prérequis
Modules 07B et 07D terminés (réutilise `documents_sources`).

## À faire

### 1. L'outil d'import de documents (le plus important de ce module) `src/lib/donnees/import-document/`
Sert pour toutes les listes publiées en PDF, Excel, CSV ou page web.
1. **Dépôt** (admin) : URL ou fichier + `source_code` + secteur + pays + date de publication
2. **Extraction** :
   - Excel ou CSV : lecture directe (`exceljs`)
   - Page web : tableaux HTML (`cheerio`)
   - PDF : texte (`unpdf`) puis Claude (`claude-haiku-5-5`) qui renvoie des lignes JSON `{ nom, numero_agrement, adresse, ville, telephone, email, site, categorie, dirigeant? }`
3. **Aperçu** : les 50 premières lignes et les lignes douteuses (champs vides, doublons) affichées à l'admin
4. **Validation humaine** obligatoire avant l'écriture
5. **Écriture** : `listes_sectorielles` + `listes_sectorielles_membres`, puis rapprochement avec l'annuaire (module 07B) ; les membres non trouvés deviennent de nouvelles entreprises si la ligne contient au moins un nom et une ville
6. **Mise à jour** : un nouveau document de la même liste est comparé à l'ancien (entrées, sorties) ; une entreprise sortie d'une liste d'agrément reçoit une note, sans être supprimée
- Server Actions admin : `deposerDocument`, `apercuImport`, `validerImport`, `annulerImport`
- Le document original est gardé dans le bucket privé `documents-officiels`, avec son empreinte

### 2. Catalogue de départ `docs/sources/listes-a-importer.md`
Écris ce fichier : pour chacune des listes du registre (section 3), par pays couvert, une ligne « émetteur, titre, URL si connue, format, statut (`a_trouver`, `trouvee`, `importee`) ». L'équipe le complétera.

### 3. Marchés publics
- `banque_mondiale_contrats.ts` (tâche Trigger.dev, hebdomadaire) : jeu de données ouvert des contrats attribués de la Banque mondiale, filtré sur les pays couverts → `marches_publics` ; attributaire rapproché de l'annuaire → signal `marche_attribue` (montant dans le détail)
- `bad_marches.ts`, `ungm_attributions.ts`, `marches_publics_nationaux.ts` : passent par l'outil d'import de documents. Un connecteur automatique par portail national seulement après lecture de ses conditions (source 🟡 « à vérifier ») et `conditions_remplies = true`
- Acheteurs publics actifs → signal `acheteur_public`

### 4. Bourses
- Import (outil d'import) de la liste des sociétés cotées de la BRVM, de la NGX (Nigeria) et de la GSE (Ghana) → signal `cotee_en_bourse`, `tranche_effectif` au moins `250+` si inconnue

### 5. Chambres, patronats, salons
- Listes de membres et catalogues d'exposants : outil d'import de documents, avec `evenements` et `evenements_participants` pour les salons → signaux `membre_chambre`, `exposant_salon`
- Seulement les listes **publiées publiquement** ; source par source, l'admin coche `conditions_remplies` après avoir lu les conditions du site

### 6. Douanes
- Rien de nominatif. Seulement les statistiques officielles publiées, dans `statistiques_zones`

## Tests
- Un fichier Excel de 30 banques (fixture) est importé, rapproché, et 2 lignes en doublon sont signalées dans l'aperçu
- Rien n'est écrit tant que l'import n'est pas validé
- Un contrat de la Banque mondiale crée un signal `marche_attribue` sur la bonne entreprise
- Une 2e version d'une liste fait apparaître les entrées et sorties

## Critères d'acceptation
- [ ] La liste BCEAO des banques d'un pays est importée de bout en bout
- [ ] Les contrats Banque mondiale des 16 pays sont chargés
