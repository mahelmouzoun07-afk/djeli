# Avant de commencer le backend avec Harness

Ce document répond à deux questions : **avec quels outils Harness travaille**, et **ce que tu dois faire toi-même** avant et pendant les modules.

---

## 1. Les outils de Harness

### A. Les logiciels sur ton ordinateur

| Outil | À quoi il sert | État |
|---|---|---|
| Node.js 24 + npm 11 | Faire tourner le projet et installer les bibliothèques | ✅ Installé |
| Git | Garder l'historique du code | ✅ Installé |
| GitHub CLI (`gh`) | Envoyer le code sur GitHub | ✅ Installé et connecté |
| **Docker Desktop** | Faire tourner Supabase (la base de données) sur ton ordinateur | ❌ **À installer** |
| Supabase CLI | Créer les tables, lancer la base locale | Automatique (`npx supabase`) |
| Trigger.dev CLI | Lancer les tâches de fond en local | Automatique (`npx trigger.dev`) |
| Playwright | Lire les sites faits en JavaScript | Installé par Harness au module 06 |

### B. Les bibliothèques (Harness les installe lui-même)

| Bibliothèque | Rôle | Module |
|---|---|---|
| `@supabase/supabase-js`, `@supabase/ssr` | Parler à la base de données, gérer les connexions | 01 |
| `zod` | Vérifier toutes les données qui entrent (formulaires, IA, webhooks) | 01 |
| `@anthropic-ai/sdk` | Appeler Claude (le cerveau de l'agent) | 01, 06 |
| `resend` | Emails automatiques (bienvenue, alertes, reçus) | 01, 13 |
| `vitest` | Tester le code automatiquement | 01 |
| `libphonenumber-js` | Mettre les numéros au bon format (+229…) | 04 |
| `cheerio` | Lire le texte d'un site | 06 |
| `@duckdb/node-api` | Lire les gros fichiers Overture, Foursquare, OpenStreetMap et Common Crawl | 07C, 07F |
| `tldts` | Reconnaître le vrai domaine d'un site | 07B |
| `unpdf` | Lire le texte des PDF (journaux officiels, listes) | 07D, 07E |
| `exceljs` | Lire les listes officielles en Excel | 07E |
| `@trigger.dev/sdk` | Tâches de fond : analyses, envois, relances | 06, 11 |
| `nodemailer`, `imapflow` | Envoyer les emails depuis nos boîtes et lire les réponses | 10 |
| `googleapis` | Google Agenda | 13 |

Règle : Harness ne doit **pas ajouter d'autre bibliothèque** sans l'expliquer dans son rapport.

### C. Les services en ligne

| Service | Rôle | Prix pour commencer | Nécessaire au module |
|---|---|---|---|
| Supabase | Base de données en ligne (pour la mise en ligne) | Gratuit | 15 (en local avant) |
| Anthropic (Claude) | Le cerveau de l'agent | **Payant à l'usage** : environ 5 $ de crédit pour tous les tests | 06 |
| FedaPay | Paiements Mobile Money (mode test) | Gratuit en mode test | 05 |
| Trigger.dev | Tâches de fond | Gratuit pour commencer | 06 |
| Groq | Transcription des notes vocales | Gratuit pour commencer | 12 |
| Meta (WhatsApp Business Platform) | Envoi WhatsApp | Numéro de test gratuit | 10 |
| Boîtes email Djeli + préchauffage | Envoi des emails de prospection | Payant (environ 2 à 7 $ par boîte et par mois) | 10 |
| Nom de domaine `djeliai.com` | Adresse du site et des emails | Environ 10 à 15 $ par an | 10 et mise en ligne |
| Resend | Emails automatiques | Gratuit (3 000 par mois) | Mise en ligne |
| Google Cloud | Google Agenda | Gratuit | 13 |
| ElevenLabs | Voix des appels IA | Petit forfait gratuit | 14 |

Bonne nouvelle : **les modules 01 à 05 ne coûtent rien**. Le premier coût réel arrive au module 06 (Claude).

---

## 2. Ce que tu fais avant le module 01

Pour démarrer **aujourd'hui**, une seule chose est vraiment obligatoire : **Docker Desktop**.

### Étape 1 : vérifier que la virtualisation est active
1. Appuie sur `Ctrl + Maj + Échap` pour ouvrir le Gestionnaire des tâches
2. Onglet **Performance**, puis **Processeur**
3. En bas à droite, cherche **Virtualisation : Activé**
4. Si c'est « Désactivé » : il faut l'activer dans le BIOS de ton ordinateur HP. Dis-le-moi, je te guiderai

### Étape 2 : installer WSL (le « Linux dans Windows » dont Docker a besoin)
1. Clic droit sur le bouton Démarrer, puis **Terminal (administrateur)**
2. Tape : `wsl --install`
3. Redémarre l'ordinateur quand c'est demandé

### Étape 3 : installer Docker Desktop
1. Va sur https://www.docker.com/products/docker-desktop/
2. Télécharge la version **Windows**
3. Installe en gardant les options par défaut (« Use WSL 2 » doit être coché)
4. Lance Docker Desktop. Accepte les conditions. Pas besoin de créer de compte (tu peux cliquer sur « Skip »)
5. Vérifie : dans un terminal, tape `docker --version`. Une version doit s'afficher

> Docker doit être **lancé** (icône de baleine en bas à droite) à chaque fois que Harness travaille sur la base de données.

### Étape 4 : préparer Harness
1. Ouvre Harness dans le dossier `C:\Users\HP\Desktop\djeli`
2. Autorise-le à : lire et écrire les fichiers **de ce dossier**, lancer `npm`, `npx`, `git` et `docker`
3. Refuse-lui : `git push --force`, la suppression de fichiers hors du dossier, l'accès à tes autres dossiers
4. **Une nouvelle session par module** : il garde ainsi les idées claires

---

## 3. Ce que tu fais pendant les modules (au bon moment)

| Avant le module | Ce que tu fais | Ce que tu récupères | Où le mettre |
|---|---|---|---|
| 01 | Rien d'autre que Docker | — | — |
| 01 (à la fin) | Copier `.env.example` en `.env.local` : dans le terminal, `copy .env.example .env.local` | — | Dossier `djeli` |
| 02 | Lancer Docker Desktop | — | — |
| 04 | Rien : en local, les emails de connexion arrivent dans une boîte de test (http://localhost:54324) | — | — |
| 05 | Créer un compte sur https://fedapay.com, rester en **mode Sandbox** | Clé secrète de test | `FEDAPAY_SECRET_KEY` dans `.env.local` |
| 06 | Créer un compte sur https://console.anthropic.com, ajouter 5 $ de crédit | Clé API | `ANTHROPIC_API_KEY` |
| 06 | Créer un compte sur https://trigger.dev, créer un projet « djeli » | Clé secrète du projet | `TRIGGER_SECRET_KEY` |
| 07C | Laisser environ 20 Go libres sur le disque pour les fichiers de l'annuaire | — | — |
| 07C | Rien à acheter : Overture, Foursquare, OpenStreetMap, GLEIF et Wikidata sont gratuits. Pour Foursquare, créer un compte gratuit sur leur portail si le téléchargement le demande | — | — |
| 07C (plus tard) | Compte Google Cloud avec l'API Places, et un plafond de dépense | Clé API | `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACES_BUDGET_JOUR` |
| 07D | Trouver les sites qui publient le journal officiel et les annonces légales de chaque pays | Liste d'adresses | Donne-la-moi, je l'ajoute |
| 07D | Écrire aux guichets uniques (APIEx, CEPICI, APIX) et au portail RCCM OHADA pour demander un accès ou une convention | Leur réponse | — |
| 07E | Récupérer les listes officielles (BCEAO, CIMA, régulateurs, ministères…) : voir `docs/sources/listes-a-importer.md` | Fichiers PDF ou Excel | Outil d'import de l'admin |
| 07F | Dans Google Cloud, activer YouTube Data API et Chrome UX Report API | Clé API | `GOOGLE_API_KEY` |
| 07G | Recruter les premiers ambassadeurs terrain (Cotonou, Dakar, Abidjan) | — | — |
| 10 | Acheter `djeliai.com` ; créer les boîtes email ; démarrer leur préchauffage | Adresses et mots de passe des boîtes | `.env.local` |
| 10 | Créer un compte Meta Business et ajouter WhatsApp (numéro de test) | Jeton, secret de l'application | `WHATSAPP_TOKEN`, `WHATSAPP_APP_SECRET` |
| 12 | Créer un compte sur https://console.groq.com | Clé API | `GROQ_API_KEY` |
| 13 | Créer un projet Google Cloud, activer l'API Calendar | Identifiants OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| 14 | Créer un compte sur https://elevenlabs.io | Clé API | `ELEVENLABS_API_KEY` |

### À lancer dès maintenant car c'est long
- **Meta Business** (vérification de l'entreprise) : plusieurs jours, parfois des semaines
- **Préchauffage des boîtes email** : 2 à 4 semaines avant de pouvoir envoyer en volume
- **Compte FedaPay de production** (pas le test) : demande les documents de la société

### Les 3 règles des clés secrètes
1. Elles vont **uniquement** dans `.env.local` (Git l'ignore : il ne part jamais sur GitHub)
2. Tu ne les colles **jamais** dans une conversation, ni avec Harness, ni avec moi
3. Si une clé a fuité par erreur : supprime-la sur le site du service et crée-en une nouvelle

---

## 4. Le cycle de travail avec Harness

1. Docker lancé
2. Nouvelle session Harness
3. Tu colles `00-REGLES-GENERALES.md`, puis le module
4. Harness travaille sur une branche `module-XX`, teste, puis rend son rapport
5. Tu me donnes le rapport et le nom de la branche ; je relis le code
6. Si c'est bon, tu fusionnes la branche dans `main` (je te guide la première fois). Sinon, je te donne le message de correction
