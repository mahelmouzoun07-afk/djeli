# Module 07H : qualité, scores, fraîcheur et droits des personnes

## Objectif
Savoir à tout moment **à quel point l'annuaire est bon**, le garder à jour automatiquement, et respecter les demandes des personnes (suppression, rectification, opposition).

## Prérequis
Modules 07A à 07C terminés (les autres peuvent arriver après : les scores s'adaptent).

## À faire

### 1. Les deux scores (fonction SQL `recalculer_scores(entreprise_id)`, appelée après chaque fusion)
**Score de qualité (0–100)** : la fiche est-elle complète ?
| Élément | Points |
|---|---|
| Téléphone valide | 20 |
| Catégorie précise (pas `a_classer`) | 15 |
| Site actif | 15 |
| Email générique | 10 |
| WhatsApp | 10 |
| Adresse ou position | 10 |
| Identifiant légal (RCCM ou fiscal) | 10 |
| Tranche d'effectif | 5 |
| Au moins un réseau social | 5 |

**Score de confiance (0–100)** : la fiche est-elle vraie et à jour ?
- Base selon `statut_verification` : `non_verifie` 30, `recoupe` 50, `verifie_site` 60, `verifie_registre` 75, `verifie_terrain` 85, `verifie_proprietaire` 95
- +5 par source indépendante supplémentaire (maximum +15)
- −10 si aucune source n'a confirmé la fiche depuis 12 mois ; −30 si un signal `fermeture` existe
- Les pondérations sont dans `src/lib/donnees/scores.ts` (une copie en SQL, testée sur les mêmes exemples)

### 2. Calendrier de rafraîchissement
- Tâche Trigger.dev `src/trigger/planificateur-sources.ts` (toutes les heures) : lance les synchronisations dont `derniere_sync + frequence_sync` est passée, pour les sources actives
- Les fréquences par défaut sont celles du registre ; Google Places n'est jamais rafraîchi (rien n'est stocké)

### 3. Détection des fermetures
Une entreprise passe `fermee` si l'un de ces cas arrive : date de fermeture Foursquare, tag OSM `disused`, annonce de dissolution (`radiee`), visite terrain « fermée », ou site injoignable **et** aucune source depuis 18 mois. Elle n'est jamais supprimée (historique), mais n'est plus proposée en prospection.

### 4. Droits des personnes
- Server Action publique `demanderSuppression({ valeur, type })` (email ou téléphone) avec vérification par code ou lien
- Traitement automatique : suppression des contacts nominatifs et des particuliers correspondants, effacement des provenances liées, ajout à `opt_outs`, confirmation envoyée ; délai maximal 30 jours, alerte à l'équipe à J+20 si non traité
- Rectification : la valeur corrigée devient `verifie_proprietaire`
- Journal de chaque demande dans `demandes_suppression` (sans garder la donnée supprimée au-delà de la valeur hachée)

### 5. Tableau de qualité (vues SQL pour l'admin)
- `qualite_par_pays` : nombre d'entreprises et de lieux actifs, part avec téléphone, site, email, WhatsApp, identifiant légal, scores moyens
- `qualite_par_categorie` : mêmes indicateurs par catégorie et par pays
- `fraicheur_sources` : dernière synchronisation réussie, retard par rapport à la fréquence prévue, erreurs
- `file_relecture` : rapprochements, imports et vérifications en attente
- Server Action admin `tableauQualite()` qui lit ces vues

### 6. Jeu de vérité (pour mesurer la qualité du rapprochement)
- `tests/fixtures/annuaire/verite.csv` : 200 fiches réelles de Cotonou et de Dakar vérifiées à la main par l'équipe (même entreprise ou non entre deux sources). Le fichier est fourni par l'équipe ; en attendant, créer le format et 20 exemples
- Script `scripts/annuaire/mesurer-rapprochement.ts` : précision et rappel du rapprochement. Objectif : précision ≥ 95 % (on préfère rater une fusion que fusionner deux entreprises différentes)

## Tests
- Les scores donnent les valeurs attendues sur 5 fiches types (vide, open data seule, recoupée, vérifiée registre, revendiquée)
- Une demande de suppression efface le contact, ajoute l'opt-out, et la personne n'apparaît plus dans aucune recherche
- Une source en retard apparaît dans `fraicheur_sources`

## Critères d'acceptation
- [ ] Le tableau de qualité affiche des chiffres réels après la vague 1
- [ ] Le script de mesure donne la précision du rapprochement
