# Module 11 : séquences, planification et tâches de fond

## Objectif
Faire tourner l'agent tout seul, 24 h/24 : lancer les campagnes, envoyer chaque étape au bon moment, s'arrêter dès qu'un prospect répond, respecter budgets et plafonds.

## Prérequis
Modules 08, 09 et 10 terminés.

## À faire

### 1. Trigger.dev
- `trigger.config.ts`, dossier `src/trigger/`
- Toutes les tâches : idempotentes, avec nouvelles tentatives (3, délai croissant), durée maximale définie, journalisées

### 2. Démarrer une campagne : Server Action `lancerCampagne(campagneId)`
- Vérifie : style validé, solde > 0, au moins un canal autorisé
- Affiche/renvoie l'estimation (`estimerCampagne`) ; le client confirme
- Passe la campagne en `active` et déclenche `src/trigger/demarrer-campagne.ts` : sélection (module 08) → analyses → séquences → premiers messages rédigés et planifiés

### 3. Le planificateur `src/trigger/planificateur.ts` (toutes les 5 minutes)
- Prend les messages `planifie` dont l'heure est passée, par lots
- Pour chacun : vérifie que la campagne est `active` et que le prospect n'a **pas répondu** entre-temps, puis envoie (module 10)
- Après l'envoi d'une étape : rédige et planifie l'étape suivante de la séquence (module 09)
- Répartit les envois dans la journée (pas de rafale : délai aléatoire de 2 à 8 minutes entre deux messages d'une même boîte ou d'un même numéro)

### 4. Arrêts automatiques
- Le prospect répond → toutes ses étapes futures sont annulées (sur tous les canaux)
- Désinscription → tout est annulé, pour tous les clients
- Solde à 0 ou plafond du jour atteint → nouvelles étapes en attente, reprise automatique dès que possible ; l'agent continue de **répondre** aux conversations en cours
- Campagne en pause → plus rien ne part ; reprise → on repart où on s'était arrêté

### 5. Contrôles de la campagne (Server Actions)
- `mettreEnPause`, `reprendre`, `terminer`, `modifierPlafond`, `modifierCanaux`, `modifierRepartition`
- Toute modification est enregistrée dans `journal_evenements`

### 6. Tâches planifiées
| Tâche | Fréquence |
|---|---|
| Planificateur | 5 min |
| Lecture IMAP | 2 min |
| Rattrapage des paiements | 10 min |
| Remise à zéro des compteurs `envoyes_aujourdhui` | chaque nuit, 0 h UTC |
| Expiration des crédits | chaque nuit |
| Statistiques et ajustements de la semaine (module 12) | chaque lundi 6 h |
| Relance J90 | chaque jour |

## Tests
- Un prospect qui répond après l'étape 1 ne reçoit jamais l'étape 2
- Une campagne en pause n'envoie plus rien, même si des messages sont déjà planifiés
- Le planificateur lancé deux fois en même temps n'envoie pas deux fois le même message (verrou en base : `update … set statut = 'en_cours' where statut = 'planifie' returning`)

## Critères d'acceptation
- [ ] Une campagne de test de 10 prospects déroule sa séquence en accéléré (option `TEMPS_ACCELERE=1` : 1 jour = 1 minute, réservée au local)
- [ ] Aucun doublon d'envoi dans les journaux
