# Module 08 : sélection des prospects, analyse et choix du canal

## Objectif
Pour une campagne : trouver les prospects dans l'annuaire, analyser chacun (4 crédits), puis décider **par quel canal** et **dans quel ordre** le contacter.

## Prérequis
Modules 03, 06 et 07 terminés.

## À faire

### 1. Sélection `src/lib/prospects/selection.ts`
- `selectionnerProspects(campagneId, nombre)` : appelle `chercherEntreprises` avec les critères du profil cible, trie par adéquation, crée les lignes `prospects` (statut `nouveau`)
- Score d'adéquation de base (sans IA, gratuit) : correspondance de catégorie, ville, taille, qualité de la fiche, présence d'un canal de contact
- Ne garde que les prospects qui ont **au moins un moyen de contact autorisé** par la campagne
- Règle globale : ignorer les contacts présents dans `opt_outs`, et ceux qui ont reçu un premier message Djeli il y a moins de 7 jours (`contacts_recents`)

### 2. Analyse d'un prospect `src/trigger/analyser-prospect.ts`
- Débite 4 crédits (clé `analyse:` + prospect_id). Si refus (solde ou plafond) : la campagne passe `en_pause` avec la raison
- Rassemble : fiche annuaire, lecture du site (module 06), signaux publics disponibles
- Prompt `analyse-prospect.ts` (`claude-haiku-5-5` pour lire, `claude-sonnet-5-5` pour la synthèse) → JSON validé :
  `{ resume, besoin_probable, accroche, decideur_probable, langue, taille_estimee, signaux[], canaux: { email: {disponible, score}, whatsapp: {...}, sms: {...}, appel: {...} }, score_adequation, raison_exclusion? }`
- Si `raison_exclusion` (activité refusée par `docs/INTERDITS.md`, hors cible, entreprise fermée) : statut `injoignable`, pas de message
- Met en cache l'analyse d'une entreprise de l'annuaire pendant 30 jours (deux clients qui ciblent la même entreprise ne repaient pas notre coût IA ; chacun paie toutefois ses 4 crédits)

### 3. Choix du canal `src/lib/prospects/choix-canal.ts` (code déterministe, pas d'IA)
Règles de départ (source : `docs/SQUELETTE.md`) :
- **Grande entreprise** (taille estimée ≥ 50 ou catégorie « grand compte ») : email d'abord, puis WhatsApp 1 à 2 jours après sans réponse
- **PME et particuliers** : WhatsApp d'abord
- Canal exclu s'il n'est pas dans `canaux_autorises` de la campagne, si le contact manque, ou si le pays l'interdit (table `src/lib/envoi/regles-pays.ts`)
- En mode `manuel`, respecter la répartition en % du client ; en mode `automatique`, pondérer par le taux de réponse observé (table `statistiques_canaux` : pays × catégorie × canal → envoyés, réponses), avec 20 % d'exploration
- Résultat : la séquence du prospect, ex. `[{jour:1,canal:'whatsapp'},{jour:3,canal:'whatsapp'},{jour:5,canal:'email'}…]` d'après le modèle J1/J3/J5/J7/J9/J10/J90 de la campagne

### 4. Migration
- Table `statistiques_canaux` (service uniquement) et fonction pour l'incrémenter (utilisée au module 12)
- Table `cache_analyses` : `annuaire_entreprise_id`, `analyse` jsonb, `expire_le`

## Tests
- Un prospect en `opt_outs` n'est jamais sélectionné
- Grande entreprise → séquence qui commence par email ; PME → par WhatsApp
- Canal non autorisé par la campagne → jamais choisi
- Solde insuffisant → campagne en pause, aucune analyse lancée au-delà

## Critères d'acceptation
- [ ] Une campagne de 20 prospects de test donne 20 analyses et 20 séquences cohérentes
- [ ] 80 crédits débités, pas un de plus
