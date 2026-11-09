# Module 13 : rendez-vous, notifications au client et support

## Objectif
Prendre les rendez-vous dans le Google Agenda du client, prévenir le client des événements importants (WhatsApp + email), et répondre à ses questions 24 h/24 avec un agent de support.

## Prérequis
Module 12 terminé.

## À faire

### 1. Google Agenda `src/lib/agenda/google.ts`
- Connexion OAuth (portée `calendar.events` + `calendar.freebusy` seulement) depuis `/parametres` ; jeton de rafraîchissement **chiffré** (pgsodium / Supabase Vault) ; `integrations.jeton_ref`
- `creneauxLibres({ entrepriseId, du, au, duree })` : lit les disponibilités, respecte les horaires de travail du client (`entreprises.horaires_rdv` jsonb, à ajouter par migration)
- `reserver({ prospect, debut, fin, lieu })` : crée l'événement avec le prospect en invité (s'il a un email), lien Google Meet si visio
- Sans Google Agenda connecté : l'agent propose les horaires définis par le client, puis demande confirmation au client par WhatsApp avant de confirmer au prospect

### 2. Prise de rendez-vous dans la conversation
- Quand `demande_rdv` (module 12) : l'agent propose 2 ou 3 créneaux, le prospect choisit, l'agent réserve et confirme
- Rappel au prospect la veille et 1 h avant (WhatsApp si conversation ouverte, sinon email)
- Après le rendez-vous : question au client « Le rendez-vous a-t-il eu lieu ? » (honoré / non venu) pour les statistiques

### 3. Notifications au client `src/lib/notifications/`
- Fonction unique `notifierClient(entrepriseId, evenement, donnees)` ; canaux : WhatsApp (numéro global Djeli vers `entreprises.whatsapp_notification`) + email (Resend), selon ses préférences
- Événements : `prospect_interesse`, `question_en_attente` (avec boutons Oui / Non), `rdv_pris`, `rdv_rappel`, `note_vocale_incomprise`, `alerte_solde_20`, `alerte_solde_5`, `solde_epuise`, `campagne_en_pause`, `paiement_reussi`, `bilan_hebdo`, `probleme_canal` (numéro limité, message non livré, plainte : **on ne cache jamais un problème**)
- Modèles de messages en français dans `src/lib/notifications/modeles/`
- Réponses du client sur WhatsApp (« Oui », « Non », texte libre) → rattachées à la question en attente, et l'agent continue la conversation avec le prospect

### 4. Pilotage par WhatsApp (texte uniquement)
- Le client peut écrire au numéro global : « pause », « reprends », « solde », « bilan », « combien de rendez-vous ? »
- Classement de l'intention (`claude-haiku-5-5`) ; **toute modification de réglage est reformulée et exige un « Oui »** avant d'être appliquée (`docs/INTERDITS.md`, section 5)
- Le numéro de l'expéditeur doit correspondre à un membre de l'entreprise, sinon refus

### 5. Agent de support 24 h/24
- Même numéro global ; si le message n'est pas une commande de pilotage → agent de support
- Base de connaissances : `docs/support/*.md` (FAQ, crédits, paiements, canaux, règles) ; réponses uniquement à partir de cette base et des données du compte (solde, campagnes, derniers paiements)
- Ne peut rien modifier ni rembourser ; si le problème dépasse la base ou concerne un paiement → ticket (`tickets_support`, migration) + message « Un membre de l'équipe vous répond sous 24 h »

## Variables d'environnement
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `WHATSAPP_NUMERO_GLOBAL_ID`

## Tests
- Deux prospects ne peuvent pas réserver le même créneau (verrou)
- « Mets en pause » sans « Oui » ne change rien
- Un numéro inconnu ne peut pas piloter un compte
- L'agent de support ne donne jamais d'information sur un autre client

## Critères d'acceptation
- [ ] Un rendez-vous de test apparaît dans un Google Agenda de test
- [ ] Le client reçoit les alertes 20 % et 5 % une seule fois par rechargement
