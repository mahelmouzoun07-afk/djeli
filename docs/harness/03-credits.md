# Module 03 : le moteur de crédits

## Objectif
Gérer le solde de crédits de chaque client de façon **sûre** : jamais de solde négatif, jamais de double débit, toujours un historique. C'est l'argent du client : zéro approximation.

## Prérequis
Modules 01 et 02 terminés.

## Règles métier (source : `docs/MODELE-ECONOMIQUE.md` et `src/lib/constants.ts`)
- 1 crédit = 10 FCFA
- Coûts : analyse d'un prospect 4, email 2, WhatsApp 6, SMS 6, appel 15 par minute commencée
- Gratuit : analyse de l'activité du client, profils cibles, aperçu, conversation après une réponse du prospect, rendez-vous
- Crédits achetés valables 12 mois ; les plus anciens sont consommés en premier
- Message non livré (statut `echoue` ou `bloque`) : crédits rendus automatiquement
- Plafond de dépense par jour et par campagne, fixé par le client
- Alertes au client quand le solde passe sous 20 % puis sous 5 % du dernier rechargement
- À 0 crédit : plus aucun **nouveau** contact, mais l'agent **continue de répondre** aux prospects qui ont déjà répondu (c'est gratuit)

## À faire

### 1. Migration : fonctions SQL (toutes `security definer`, `search_path` fixé, exécutables seulement par `service_role`)
- `crediter(entreprise uuid, montant int, type type_transaction, motif text, reference text, cle text, expire_le timestamptz)` → nouveau solde
- `debiter(entreprise uuid, montant int, motif text, reference text, cle text, campagne uuid, canal canal)` → `(ok boolean, solde int, raison text)`
  - Verrouille la ligne du solde (`select … for update`)
  - Si `cle` existe déjà dans `transactions_credits` : renvoie le résultat précédent sans rien débiter (idempotence)
  - Refuse si solde insuffisant (`raison = 'solde_insuffisant'`)
  - Refuse si le plafond du jour de la campagne serait dépassé (`raison = 'plafond_jour'`), en lisant `depenses_jour` (jour calculé dans le fuseau du client)
  - Sinon : débite, écrit la transaction, incrémente `depenses_jour`
- `rembourser(cle_debit text, motif text)` : recrédite exactement le montant du débit d'origine, une seule fois
- `expirer_credits()` : appelée chaque nuit, retire les crédits d'achats de plus de 12 mois non consommés (type `expiration`)

### 2. `src/lib/credits/`
- `couts.ts` : `coutAction(action, { minutes? })` qui lit `src/lib/constants.ts`. Seul endroit du code qui calcule un coût
- `service.ts` (serveur uniquement, client admin) : `debiter()`, `crediter()`, `rembourser()`, `lireSolde()`, qui appellent les fonctions SQL et renvoient un `Resultat`
- `estimation.ts` : `estimerCampagne({ nbProspects, canaux, relances })` → crédits minimum et maximum, et équivalent en FCFA (affiché au client avant de lancer une campagne)
- `alertes.ts` : après chaque débit, vérifie les seuils 20 % et 5 % ; si franchi et pas encore envoyé, crée un événement `alerte_solde` (l'envoi réel est au module 13)

### 3. Server Actions `src/app/(app)/credits/actions.ts`
- `obtenirSolde()`, `obtenirHistorique({ page })` (lecture seule, client RLS)

## Tests obligatoires
- 100 débits simultanés de 6 crédits sur un solde de 300 : exactement 50 réussissent, solde final 0
- Un débit rejoué avec la même clé ne débite qu'une fois
- Un remboursement rejoué ne recrédite qu'une fois
- Le plafond du jour bloque le débit qui le dépasserait
- `estimerCampagne` donne bien 22 crédits maximum pour 1 PME en WhatsApp avec 2 relances (4 + 6 + 6 + 6)
- L'expiration ne touche que les crédits de plus de 12 mois

## Critères d'acceptation
- [ ] Aucun endroit du code ne modifie `soldes_credits` sans passer par ces fonctions (vérifie avec une recherche)
- [ ] Tous les tests ci-dessus passent
