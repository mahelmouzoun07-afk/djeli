# Mode d'emploi : faire coder le backend par Harness

Ici, l'architecte (Claude) écrit les instructions, et Harness (DeepSeek) écrit le code. Toi, tu fais passer les instructions de l'un à l'autre et tu vérifies le résultat.

## L'ordre des modules

| # | Module | Dépend de | Ce que tu pourras voir à la fin |
|---|---|---|---|
| 00 | Règles générales | — | (à coller avant chaque module) |
| 01 | Fondations | — | Le projet compile, `/tableau-de-bord` redirige vers `/connexion` |
| 02 | Schéma de la base | 01 | Les tables dans Supabase Studio (http://localhost:54323) |
| 03 | Crédits | 02 | Les tests des crédits passent |
| 04 | Authentification | 03 | On peut s'inscrire et se connecter |
| 05 | Paiements Mobile Money | 04 | Un achat test en sandbox ajoute des crédits |
| 06 | Analyse de l'activité | 04 | Un lien de site donne une analyse et des profils cibles |
| 07 | Annuaire | 02 | Des entreprises du Bénin et du Sénégal dans la base |
| 08 | Prospects et choix du canal | 03, 06, 07 | Une campagne trouve et analyse des prospects |
| 09 | Rédaction et vérification | 08 | Des messages personnalisés, vérifiés |
| 10 | Envoi (email, SMS, WhatsApp) | 03, 09 | Un email part vers ta propre boîte |
| 11 | Séquences et planification | 08, 09, 10 | La campagne avance toute seule |
| 12 | Réponses et conversations | 10, 11 | Les réponses arrivent dans la messagerie |
| 13 | Rendez-vous, notifications, support | 12 | Un rendez-vous dans Google Agenda |
| 14 | Appels IA | 12, 13 | Un appel simulé de bout en bout |
| 15 | Sécurité et tests finaux | tout | Les 10 scénarios passent |

Les modules **05, 06 et 07** peuvent se faire en parallèle (dans des sessions Harness séparées) une fois le 04 terminé.

## Comment faire, étape par étape

1. Ouvre une **nouvelle session** Harness dans le dossier `C:\Users\HP\Desktop\djeli`
2. Colle le contenu de `00-REGLES-GENERALES.md`
3. Juste en dessous, colle le contenu du module (par exemple `01-fondations.md`)
4. Ajoute la phrase : « Code ce module. Termine par le rapport demandé à la section 7 des règles. »
5. Quand Harness a fini, copie son **rapport** et donne-le-moi (à Claude). Je vérifie le code, je te dis si c'est bon ou ce qu'il faut corriger
6. Si c'est bon : module suivant. Sinon : je te donne un message de correction à coller dans la même session Harness

## Ce que tu dois préparer toi-même (Harness ne peut pas le faire)

| Avant le module | Quoi | Où |
|---|---|---|
| 01 | Installer Docker Desktop (nécessaire pour Supabase en local) | docker.com |
| 01 | Créer un compte Supabase et un projet | supabase.com |
| 06 | Une clé API Claude | console.anthropic.com |
| 04 | Un compte Resend + vérifier le domaine djeliai.com | resend.com |
| 05 | Un compte FedaPay en mode sandbox | fedapay.com |
| 10 | Les boîtes email Djeli (préchauffées) ; un compte Meta Business + WhatsApp Business Platform | business.facebook.com |
| 11 | Un compte Trigger.dev | trigger.dev |
| 12 | Une clé Groq (transcription) | console.groq.com |
| 13 | Un projet Google Cloud avec l'API Calendar | console.cloud.google.com |
| 14 | Un compte ElevenLabs | elevenlabs.io |

Les clés vont dans un fichier `.env.local` que **tu** crées (jamais envoyé sur git, jamais collé dans une conversation).

## Si Harness se trompe
- Il dit « terminé » mais `npm run build` échoue → renvoie-lui l'erreur complète
- Il modifie des fichiers d'un autre module → demande-lui d'annuler ces changements
- Il invente une fonction de bibliothèque qui n'existe pas → demande-lui de lire la documentation officielle de la bibliothèque
- Il veut désactiver une sécurité (RLS, TypeScript strict) pour que ça marche → refuse
