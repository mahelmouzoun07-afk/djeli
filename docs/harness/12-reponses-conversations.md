# Module 12 : réponses des prospects et conversations

## Objectif
Recevoir toutes les réponses (email, WhatsApp, SMS) dans une seule messagerie, les classer, répondre automatiquement quand c'est sûr, prévenir le client quand c'est important, et apprendre de chaque réponse.

## Prérequis
Modules 10 et 11 terminés.

## À faire

### 1. Entrée unique `src/lib/reponses/recevoir.ts`
- `recevoirMessage({ canal, de, texte?, audioUrl?, idExterne, recuLe })` appelée par l'IMAP (email) et les webhooks (WhatsApp, SMS)
- Retrouve le prospect (adresse ou numéro, puis fil de discussion) ; inconnu → conversation « sans prospect », visible par l'équipe Djeli seulement
- Enregistre le message `entrant` (idempotent sur `idExterne`), met à jour `conversations` (fenêtre WhatsApp de 24 h)
- Annule les étapes futures de la séquence (module 11)

### 2. Notes vocales des prospects `src/lib/reponses/transcription.ts`
- Téléchargement du fichier audio (WhatsApp Media API), stockage dans Supabase Storage (bucket privé `audios`)
- Transcription Whisper via Groq (`whisper-large-v3`), langue détectée
- Échec ou transcription peu fiable → classe `note_vocale_incomprise`, **transmise au client avec le contexte** (qui, quelle campagne, derniers messages) ; l'agent ne répond pas à la place du client
- Rappel : les **clients** de Djeli n'envoient jamais de notes vocales à leurs prospects

### 3. Classement `src/lib/ia/prompts/classement.ts` (`claude-haiku-5-5`)
- Sortie `{ classe, confiance, resume, demande_rdv: boolean, creneaux_proposes[], question?, langue }`
- `desinscription` (STOP, « ne m'écrivez plus », insulte…) → `opt_outs` immédiatement, réponse de confirmation courte, **sans relance**
- `refus` → statut `pas_interesse`, remerciement court, pas de relance (sauf J90 si le refus était « pas maintenant »)
- `absent` (réponse automatique) → la séquence reprend à la date de retour si elle est connue
- `interesse` ou `question` → réponse de l'agent (point 4) + alerte au client
- Confiance < 0,7 → pas de réponse automatique, transmis au client

### 4. Réponse automatique `src/lib/reponses/repondre.ts`
- Prompt `reponse-conversation.ts` (`claude-sonnet-5-5`) : historique complet + analyse du client + règles de `docs/INTERDITS.md`
- Ne répond qu'avec des informations connues ; si le prospect pose une question dont la réponse n'est pas dans l'analyse du client (prix précis, délai, stock…) : « Je vérifie et je reviens vers vous » + **question au client** (module 13)
- Passe par la vérification du module 09
- Délai avant envoi : **5 à 20 minutes**, aléatoire, pendant les heures de travail
- Si le prospect demande s'il parle à une IA : répondre honnêtement que oui, c'est l'assistant de [client]
- Conversations après réponse : **gratuites** (aucun débit)
- Si le prospect veut un rendez-vous → module 13

### 5. Messagerie (lecture pour l'interface) `src/app/(app)/messagerie/actions.ts`
- `listerConversations({ filtre: 'toutes' | 'a_traiter' | 'chaudes', curseur })`
- `lireConversation(conversationId)`
- `repondreManuellement({ conversationId, texte })` : le client écrit lui-même, l'agent se met en retrait sur cette conversation
- `reprendreAgent(conversationId)`
- Mises à jour en temps réel via Supabase Realtime sur `messages`

### 6. Apprentissage `src/trigger/statistiques-hebdo.ts`
- Met à jour `statistiques_canaux` (envoyés, réponses, intéressés, rendez-vous) par pays × catégorie × canal × étape
- Pour chaque campagne active : compare les accroches et les profils cibles, produit 3 suggestions maximum (stockées, montrées au client dans son bilan)
- Tests A/B : si la campagne a deux variantes d'accroche, répartition 50/50 puis bascule vers la meilleure après 100 envois par variante

## Tests
- « STOP » → `opt_outs` + aucune relance + confirmation unique
- Une réponse reçue deux fois (même `idExterne`) n'est traitée qu'une fois
- Une question sur un prix inconnu → pas de prix inventé, question transmise au client
- Note vocale illisible → transmise au client, pas de réponse automatique

## Critères d'acceptation
- [ ] Une réponse email et une réponse WhatsApp de test apparaissent dans la même messagerie
- [ ] Le client reçoit une alerte pour chaque prospect `interesse`
