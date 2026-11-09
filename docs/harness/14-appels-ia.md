# Module 14 : appels vocaux par IA

## Objectif
Appeler les prospects **chauds** (qui ont répondu, cliqué ou dit « peut-être ») pour confirmer un intérêt ou un rendez-vous, avec une voix IA qui annonce dès le début qu'elle est l'assistant virtuel du client.

## Prérequis
Modules 12 et 13 terminés.

## Architecture (source : `docs/PLAN.md`, « Appels de prospection par IA »)
- Orchestration et voix : **ElevenLabs Agents** (Conversational AI), cerveau : `claude-haiku-5-5` branché comme LLM personnalisé
- Ligne : selon ce qui sera ouvert (appels WhatsApp Business officiels, ou SIP d'un opérateur) ; **code une interface `LigneTelephonique`** et implémente d'abord le mode simulation (appel de test dans le navigateur, proposé par ElevenLabs)

## À faire

### 1. Avant l'appel `src/lib/appels/preparation.ts`
- Fiche d'appel (`claude-sonnet-5-5`) : qui est le prospect, son besoin, la phrase d'ouverture, 3 objections probables et leurs réponses, l'objectif (un rendez-vous), ce qu'il ne faut jamais dire
- Première phrase imposée : « Bonjour, je suis l'assistant virtuel de [nom_signature]… »

### 2. Pendant l'appel
- Webhook outils `src/app/api/webhooks/appels/outils/route.ts` (signature vérifiée) : `creneauxLibres`, `reserverRdv`, `envoyerRecapWhatsApp`, `marquerPasInteresse`, `ajouterOptOut`
- Si la personne refuse ou demande d'arrêter : fin polie immédiate + `opt_outs`

### 3. Après l'appel `src/app/api/webhooks/appels/fin/route.ts`
- Transcription et résumé, intérêt noté, fiche prospect mise à jour, client prévenu (module 13)
- Débit : 15 crédits **par minute commencée**, clé `appel:` + id d'appel ; vérifier avant l'appel qu'il y a au moins 5 minutes de crédits

### 4. Règles (code, pas seulement prompt)
- Jamais d'appel vers un numéro +1 (États-Unis, Canada)
- Seulement entre 9 h et 18 h, heure du prospect, hors vendredi midi et jours fériés
- Seulement si le prospect a un statut chaud et n'est pas dans `opt_outs`
- 2 tentatives maximum pour un même objectif, espacées d'au moins 24 h
- Pour WhatsApp : seulement si le prospect a donné son autorisation d'appel (règles de Meta), avec suivi des demandes (1 par 24 h, 2 par 7 jours)

## Variables d'environnement
`ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, `ELEVENLABS_WEBHOOK_SECRET`, `LIGNE_TELEPHONIQUE` (`simulation`, `whatsapp`, `sip`)

## Critères d'acceptation
- [ ] Un appel simulé de bout en bout : préparation → conversation → réservation d'un créneau → résumé → débit exact
- [ ] Un numéro +1 est refusé avant tout appel
