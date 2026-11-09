# Plan : Djeli, l'agent commercial IA pour l'Afrique

## Contexte

Djeli est un agent commercial IA : il trouve des clients, leur écrit, relance et apporte des rendez-vous, pendant que le patron dort. Le modèle d'inspiration est **Explee.com** (UK, ex-AutoGTM). Djeli se distingue par l'Afrique : WhatsApp autant que l'email, Mobile Money, prix en FCFA, français d'abord, entreprises sans site web.

Ce qui existe déjà :
- **Identité visuelle** (canvas Claude Design) : indigo `#2A2E8C`, safran `#F4A51C`, encre `#14110F`, craie `#F7F7F5`, baobab `#1F7A50` ; titres en Bricolage Grotesque, texte en Inter ; logo bulle + trois ondes, « djeli » en minuscules.
- **Recherche sur les sources de données** : on utilise **toutes** les sources, Google Maps et réseaux sociaux compris, par la voie officielle d'abord, avec une solution de repli quand l'API ne le permet pas.
- **Dossier `C:\Users\HP\Desktop\djeli`** : vide.

Objectif : une **app complète** (landing + authentification + tableau de bord + pipeline IA), livrée par phases, la première étant testable vite.

## Ce qu'on reprend d'Explee, et ce qu'on change

| Explee | Djeli |
|---|---|
| CTA « Collez votre site » | « Votre site web, **ou le formulaire** à cases à cocher » (ni page Facebook, ni note vocale) |
| Email uniquement | **WhatsApp d'abord**, email pour les grandes entreprises, SMS, **appels WhatsApp** ; l'agent choisit le meilleur canal pour chaque prospect, ou plusieurs si nécessaire |
| Prix en $, carte | **FCFA par défaut**, Orange Money / Wave / MTN + carte |
| Base mondiale de 105 M d'entreprises | Base africaine construite à partir de toutes les sources (voir « Données ») |
| Blanc + accent vert | Craie + indigo, CTA safran |
| Beaucoup de témoignages | **Aucun faux témoignage** : section masquée tant qu'il n'y en a pas de vrais |

À ne pas copier : leurs textes et leurs slogans (« finds clients while you sleep » est très proche de notre accroche : à reformuler avant lancement).

## Stack technique

- **Next.js** (dernière version stable, App Router) + TypeScript
- **Tailwind CSS v4 + shadcn/ui**, avec les couleurs Djeli en tokens
- **Supabase** : Postgres + PostGIS (recherche par lieu), authentification (email, Google, lien magique), temps réel, stockage (notes vocales). Offre gratuite pendant le développement (500 Mo, mise en pause après 7 jours sans activité), offre Pro (~25 $/mois, 8 Go) dès que l'annuaire d'Afrique de l'Ouest est chargé
- **Claude API** : analyse de l'activité, profils cibles, analyse des prospects, rédaction, tri des réponses
- **Transcription des notes vocales envoyées par les prospects** : Whisper (via Groq ou OpenAI). Claude ne transcrit pas l'audio. Si la transcription échoue, la note est transmise au client
- **Tâches longues de l'agent** (recherche, analyse, envoi, relances) : Trigger.dev ou Inngest (offres gratuites pour démarrer). Les fonctions Vercel sont coupées au bout de quelques minutes
- **Lecture des sites** : notre propre robot (requête + extraction du texte), Playwright pour les sites qui ont besoin de JavaScript
- **Préparation de l'annuaire** : DuckDB pour filtrer et dédoublonner les fichiers Overture et Foursquare (formats Parquet) avant de les charger dans Postgres
- **Envoi** : comme Explee, **depuis les comptes de Djeli, jamais ceux du client**. Boîtes email Djeli préchauffées et vérifiées (SPF, DKIM, DMARC), partagées entre les clients, mises en pause dès qu'elles sont signalées ; le message est signé au nom du client ; Resend seulement pour les emails transactionnels (inscription, alertes), car les services transactionnels interdisent ou limitent l'envoi à froid. WhatsApp Cloud API, Messenger et Instagram (API Meta), SMS (Twilio, Orange ou agrégateur local)
- **Paiement** : Mobile Money uniquement (MTN MoMo, Moov, Wave, Celtiis, Orange…), **pas de carte bancaire**. Prestataire : SaaSPay (à confirmer) ; solution de repli : FedaPay, béninois, qui couvre MTN, Moov et Celtiis au Bénin, et Wave et Orange en Côte d'Ivoire et au Sénégal
- **Emails transactionnels** (rappels de paiement, alertes) : Resend
- **Agenda** : connexion Google Agenda (API Google Calendar)
- **i18n** : `next-intl`, français principal, anglais par traduction automatique relue
- **Hébergement** : Vercel. L'offre gratuite (Hobby) interdit l'usage commercial : offre Pro (~20 $/mois) au lancement, ou Cloudflare (gratuit en usage commercial) si on veut rester à 0 €

**Verdict sur la stack** : solide pour ce qu'on veut faire, à condition d'ajouter la transcription, les tâches longues et le robot de lecture ci-dessus.

## Structure du projet

```
djeli/
├── messages/fr.json, en.json
├── src/app/[locale]/
│   ├── page.tsx                  landing
│   ├── tarifs/
│   ├── (auth)/connexion, inscription
│   └── (app)/
│       ├── tableau-de-bord/      accueil
│       ├── demarrage/            assistant post-inscription
│       ├── campagnes/[id]/
│       ├── prospects/[id]/
│       ├── messagerie/           réponses à valider
│       ├── credits/
│       └── parametres/
├── src/app/api/                  ia/, prospects/, campagnes/, webhooks/
├── src/components/landing/, app/, ui/
├── src/lib/supabase/, ia/, paiements/, envoi/, donnees/
└── supabase/migrations/
```

## Landing page (dans l'ordre)

1. **Barre de navigation** : logo, Tarifs, Connexion, FR/EN
2. **Hero** : « Trouvez vos clients pendant que vous dormez. » + trois façons de démarrer :
   - **Lien du site** : l'agent analyse le site, aucune question posée (il montre ce qu'il a compris, le client peut corriger)
   - **Décrire** : formulaire comme celui d'Explee (ce que vous vendez, client idéal, marchés), mais plus approfondi, avec des cases à cocher
   + bouton safran « Trouver mes clients » + mention « Paiement par Mobile Money »
   Parcours : analyse → questions seulement si le site ne suffit pas → aperçu → inscription → achat de crédits → accès aux prospects
3. **Le pipeline en 6 étapes**, chacune avec une maquette d'interface : comprendre votre activité → trouver vos acheteurs → trouver les décideurs → écrire un message personnel → gérer les réponses et prendre les rendez-vous → apprendre et ajuster
4. **Vous restez aux commandes** : la conversation WhatsApp du canvas (« Lead chaud », « Question en attente : Oui / Non »)
5. **Trois différences** : base africaine ; tous les canaux où vos clients répondent (email, WhatsApp, Messenger, Instagram, LinkedIn, SMS) ; payez à l'usage en FCFA
6. **Tarifs** : packs de crédits en FCFA (montants à fixer après calcul des coûts)
7. **FAQ** : pas de site web ? quels pays ? spam ? Mobile Money ? WhatsApp ? mes données ?
8. **CTA final** avec le champ répété
9. **Pied de page** : CGU, confidentialité, mentions légales, contact WhatsApp

Les témoignages et le compteur « X prospects trouvés » apparaissent seulement quand les chiffres sont réels.

## Tableau de bord

- **Démarrage** : lien du site (questions seulement si besoin) / formulaire détaillé à cases à cocher → l'IA présente son analyse et 3 à 5 profils de clients → le client valide ou corrige
- **Accueil** : crédits restants, campagnes actives, leads chauds, rendez-vous, activité récente
- **Campagnes** : liste avec statut (en cours, en pause…) ; détail avec onglets Aperçu / Prospects / Messages / Réponses
- **Prospects** : tableau filtrable, fiche avec historique des échanges, export CSV
- **Messagerie** : chaque réponse avec la proposition de l'IA, à valider, modifier ou refuser
- **Crédits** : solde, historique, achat
- **Paramètres** : profil d'entreprise, signature, WhatsApp de notification, langue

**Règle produit** : au début, aucun message ne part sans validation du client. L'envoi automatique devient une option une fois la confiance établie.

## Base de données (tables principales)

`profiles`, `entreprises` (client, analyse IA en JSONB), `profils_cibles`, `campagnes`, `prospects` (entreprise, contact, source, score, statut, base légale du contact), `messages` (canal, sens, statut), `rendez_vous`, `credits` + `transactions_credits` (montants entiers en FCFA), `opt_outs` (désinscriptions, globales à tous les clients).

Row Level Security sur chaque table : un client ne voit que ses données. La base d'entreprises partagée (`annuaire`) est séparée des prospects de chaque client.

## Pipeline IA (analyse poussée)

1. **Analyse du client** : site ou formulaire, plus ses réseaux sociaux publics, ses concurrents, ses prix. Fiche structurée : offres, clientèle, zone, arguments, preuves.
2. **Profils cibles** : 3 à 5 segments avec secteurs, tailles, pays, signaux d'achat.
3. **Recherche** : dans notre annuaire, score d'adéquation.
4. **Analyse de chaque prospect** : site, réseaux sociaux (via les API officielles), avis, offres d'emploi, publicités actives, actualités, registre. Résultat : ce qu'il fait, ce dont il a probablement besoin, qui décide, **où il est actif et où il répond**.
5. **Choix du canal** : l'agent attribue à chaque canal un score (présence et activité du prospect, taux de réponse observé par pays et secteur, coût, consentement, règles du pays). Il choisit le meilleur, puis enchaîne sur d'autres canaux si le prospect ne répond pas (séquence multicanal). Le client fixe un budget et peut interdire un canal.
6. **Rédaction** : un message adapté à chaque canal (long pour l'email, court pour WhatsApp, professionnel pour LinkedIn), dans la langue du prospect.
7. **Envoi** : automatique là où l'API l'autorise, **assisté** ailleurs (voir ci-dessous). Limites quotidiennes, horaires locaux, désinscription, crédits débités.
8. **Réponses** : toutes les réponses arrivent dans une seule messagerie, quel que soit le canal. L'IA les classe, propose une réponse, prend le rendez-vous ; le client est prévenu sur WhatsApp.
9. **Apprentissage** : chaque réponse alimente le score des canaux et des messages. C'est l'avantage qui grandit avec le temps.

### Les canaux : ce que les plateformes autorisent

| Canal | Premier message par API | Comment Djeli s'en sert |
|---|---|---|
| Email | Oui, avec boîtes dédiées | Envoi automatique |
| SMS | Oui (identifiant d'expéditeur à déclarer selon le pays) | Envoi automatique |
| WhatsApp | Seulement avec consentement et modèle validé par Meta | Pubs « Cliquer pour WhatsApp » ; envoi assisté depuis le WhatsApp du client ; automatique une fois que le prospect a écrit |
| Messenger, Instagram | Non : la marque ne répond que dans les 24 h après un message du prospect | Pubs « Cliquer pour Messenger » ; envoi assisté ; automatique dans la fenêtre |
| LinkedIn | Non : pas d'API de messagerie ni de recherche pour nous | Envoi assisté depuis le compte du client |
| TikTok | Non : pas d'API de messages | Envoi assisté ; pubs |
| Appels | Par WhatsApp, après autorisation du prospect | Voir « Appels de prospection par IA » |

### Envoyer depuis les comptes de Djeli (décision : comme Explee)

| Canal | Premier message depuis un compte Djeli ? | Ce qu'on fait |
|---|---|---|
| Email | **Oui** | Boîtes Djeli, comme Explee |
| SMS | **Oui**, avec un identifiant d'expéditeur déclaré dans chaque pays (règles plus strictes au Nigeria) | Numéros et identifiants Djeli via un agrégateur |
| WhatsApp | **Non à froid** : Meta exige l'accord du destinataire, sinon le numéro est noté « mauvaise qualité » puis bloqué | Un numéro WhatsApp Djeli officiel sert de **canal de réponse** : chaque email et SMS contient « Répondez sur WhatsApp ». Dès que le prospect écrit, l'agent converse automatiquement |
| Messenger, Instagram | **Non** : la page ne peut répondre que dans les 24 h après un message du prospect ; des messages manuels en masse font bloquer le compte | Réception seulement : le prospect qui écrit à Djeli est pris en charge |
| LinkedIn | **Non** : faux profils et automatisation interdits, comptes supprimés | Option payante officielle : publicités « Message » de LinkedIn (non disponibles dans toute l'Europe) |
| TikTok | **Non** : pas d'API de messages | Pas de prospection directe |
| Appels | **Oui**, depuis des numéros Djeli, voix IA qui annonce qu'elle est une IA | Voir « Appels de prospection par IA » |

**En résumé** : on écrit en premier par **email et SMS** depuis nos comptes, et on fait **répondre sur WhatsApp**, là où les Africains préfèrent discuter. Les autres réseaux servent à analyser les prospects et à recevoir leurs réponses.

**À ne pas faire** : faux profils, robots qui pilotent des comptes, envois en masse sur WhatsApp sans accord. Les plateformes ferment les comptes, et un numéro Djeli bloqué touche tous les clients en même temps.

## Données : toutes les sources

**Lieux et cartes**
- Overture Places, Foursquare OS Places, OpenStreetMap, Wikidata, GLEIF
- **Google Maps (API Places officielle)** : Google n'autorise à conserver que l'identifiant du lieu (`place_id`) sans limite, et les coordonnées 30 jours. Le nom, le téléphone, le site et les avis ne peuvent pas être stockés, même 20 jours. Donc on stocke le `place_id`, et l'agent demande la fiche à Google au moment où il en a besoin (environ 17 $ les 1 000 fiches au tarif Pro, à vérifier). Rafraîchir toute la base tous les 20 jours coûterait des dizaines de milliers de dollars par mois et resterait contraire aux conditions.
- Autres cartes : HERE, TomTom, Mapbox, Yango Maps (selon leurs licences)

**Registres et statistiques officielles**
- RCCM et guichets uniques (APIX, CEPICI…), journaux d'annonces légales
- Répertoires statistiques : NINEA (ANSD, Sénégal), recensements généraux des entreprises (INS Côte d'Ivoire, Cameroun…)
- CAC, BRS, CIPC, ORC, RDB, CBRD, OMPIC, RNE, GAFI ; OpenCorporates
- Portails open data nationaux (Kenya, Nigeria, Afrique du Sud, Sénégal…), listes officielles d'établissements de santé (ex. Kenya Master Health Facility List), d'écoles, de coopératives
- Listes d'agréments : banques et microfinance (BCEAO, BEAC), assurances (CIMA), télécoms (ARTP, ARTCI), ordres professionnels

**Commerce et marchés**
- Marchés publics (ARMP, DCMP), Banque mondiale, BAD, UNGM (fournisseurs de l'ONU)
- Bourses (BRVM, JSE, NGX, Casablanca, NSE)
- Données douanières import-export (registres nationaux, fournisseurs spécialisés)
- Chambres de commerce, CCI françaises et américaines à l'étranger, organisations patronales, salons

**Web**
- Certificate Transparency, Common Crawl, listes Tranco et CrUX, données WHOIS quand elles sont publiques
- Technologies des sites (Shopify, WooCommerce, modules de paiement)
- Applications publiées sur Google Play et l'App Store (les éditeurs sont des entreprises)

**Annuaires, petites annonces et plateformes**
- Kompass, Africa Business Pages, Go Africa Online, Pages Jaunes, Telecontact, Cylex, Brabys, BusinessList
- Petites annonces : CoinAfrique, Expat-Dakar, Jiji
- Livraison et réservation : Glovo, Yango Deli, Jumia Food, TripAdvisor, Booking
- Emploi : ReKrute, Emploi.sn, Educarriere, Novojob, Jobberman, BrighterMonday
- Startups : Briter Bridges, Crunchbase, Africa: The Big Deal, incubateurs
- Sous licence ou partenariat dès que les conditions interdisent la copie en masse

**Réseaux sociaux (API officielles, puis alternatives)**
- Instagram : l'API « Business Discovery » donne les infos publiques des comptes professionnels
- Facebook : Pages publiques via l'API Graph (accès soumis à validation), bibliothèque publicitaire
- YouTube Data API, X API (payante), Telegram (canaux publics)
- LinkedIn et TikTok : pas d'API de recherche pour nous ; on rattache leurs pages trouvées sur les sites et fiches, et on passe par l'envoi assisté
- Pubs actives : Meta Ad Library, Google Ads Transparency Center

**Nos propres sources**
- Annuaire gratuit « Inscrivez votre entreprise », clients, ambassadeurs terrain, partenaires (opérateurs Mobile Money, CCI, associations)

### Cadre légal
- Contacts d'entreprise d'abord ; données de personnes avec précaution
- Afrique du Sud : prospection électronique à froid désactivée (POPIA art. 69)
- Registre des désinscriptions commun à tous les clients et à tous les canaux
- Validation par un juriste, pays par pays, avant lancement

## Phases

**Décision du 9 novembre** : tout est construit pour le lancement, il n'y a plus de « version 1 » ni de « plus tard ». Le déroulé complet est dans `SQUELETTE.md`.

**Ordre de construction** (le plus long en premier) :
1. **Démarches longues, dès le premier jour** : domaines et 10 boîtes email (préchauffage de 2 à 3 semaines), Meta Business, numéros WhatsApp par pays, modèles de messages soumis à Meta, prestataire Mobile Money, noms d'expéditeur SMS, ElevenLabs
2. Projet, couleurs et typos, page d'accueil, inscription
3. Démarrage (lien et formulaire), analyse IA, profils, aperçu
4. Annuaire Afrique de l'Ouest (Overture + Foursquare), puis ajout des autres sources en continu
5. Analyse des prospects, choix du canal, séquences WhatsApp, email et SMS
6. Messagerie, réponses, notes vocales des prospects, rendez-vous et Google Agenda
7. Crédits et paiement Mobile Money
8. Pilotage du client sur WhatsApp, agent support
9. Appels WhatsApp avec voix IA
10. Tests (étape 23 du squelette), puis ouverture

**Délai** : tu vises un mois. Tout construire en un mois est très ambitieux. Les démarches auprès de Meta (vérification, validation des modèles) et le préchauffage des boîtes ne dépendent pas de nous et fixent le rythme. L'annuaire, lui, grandira en continu après l'ouverture.

## Décisions validées (8 novembre 2026)

- **Développement** : fait par Claude Code
- **Budget** : 0 au départ ; on reste sur les offres gratuites jusqu'au lancement
- **Société** : au Bénin
- **Premier client type** : graphiste débutant en Afrique
- **Zone** : toute l'Afrique de l'Ouest dès le départ ; les prospects peuvent être partout (Europe, Amériques)
- **Langues** : français principal, anglais par traduction ; **plus de note vocale** pour décrire l'activité ni pour parler à l'agent
- **Démarrage** : l'agent pose des questions seulement si le site ne donne pas l'information ; cases à cocher : secteurs, taille, pays et villes, entreprises ou particuliers, prix moyen, objectif (rendez-vous, devis, appel, visite)
- **Accès** : analyse gratuite → aperçu (vrai nombre et liste, sans noms, logos ni contacts) → inscription → achat de crédits → accès aux prospects
- **Clients** : ils peuvent vendre aux entreprises **et aux particuliers**
- **Pas de partage de prospects** entre clients ; pas de bêta
- **Paiement** : Mobile Money uniquement ; **modèle à crédits** (voir `MODELE-ECONOMIQUE.md`)
- **Envoi** : automatique, **sans validation du client**, depuis les numéros et boîtes de Djeli ; expéditeur = nom du client + nom de son entreprise
- **Canaux** : grandes entreprises : email, puis WhatsApp après 1 ou 2 jours ; PME, indépendants et particuliers : WhatsApp directement ; appels par WhatsApp ; on abandonne la prospection par Messenger, Instagram, LinkedIn et TikTok (ils servent seulement à analyser les prospects)
- **Support** : un agent IA sur le numéro général de Djeli, 24 h/24
- **Interdits de l'agent** : voir `INTERDITS.md`
- **WhatsApp** : un numéro Djeli par pays ; un seul compte pour les autres réseaux
- **Rendez-vous** : Google Agenda connecté, et l'agent propose des horaires que le client confirme sur WhatsApp
- **Questions de l'agent** : par « Oui / Non » sur WhatsApp
- **Import de listes** : oui
- **Limites d'envoi** : selon les crédits et le plafond par jour fixé par le client
- **Données** : on construit notre base et on collecte tout, entreprises et personnes
- **Modèle économique** : crédits (remplace le modèle A le 9 novembre)
- **Nom et domaine** : Djeli, djeliai.com
- **Juridique** : un agent IA documenté sera créé le moment venu
- **Produit** : site web seulement ; le client peut tout piloter depuis WhatsApp

## WhatsApp : envoi direct depuis les numéros Djeli (décision du 9 novembre)

L'agent écrit directement aux prospects depuis le numéro WhatsApp Djeli de leur pays, par l'API officielle, sans validation du client. Les règles de Meta qui s'appliquent (modèles validés, accord du destinataire, note de qualité, limites) et les protections prévues sont détaillées à l'étape 12 de `SQUELETTE.md`.

### Ancienne piste, abandonnée : envoi en un clic par le client

*Gardée pour mémoire.* Le client cliquait sur un prospect, son WhatsApp s'ouvrait avec le message déjà écrit, et il appuyait sur « Envoyer ».

Ce qui existe pour chaque réseau :

| Canal | Lien | Message déjà écrit ? |
|---|---|---|
| WhatsApp | `wa.me/<numéro>?text=…` | **Oui**, fonction officielle |
| SMS | `sms:<numéro>?body=…` | **Oui**, sur téléphone |
| Email | `mailto:…?subject=…&body=…` | **Oui** |
| Appel | `tel:<numéro>` | Sans objet |
| Messenger | `m.me/<page>` | **Non** officiellement : la conversation s'ouvre, le message est copié, le client le colle |
| Instagram | `ig.me/m/<compte>` | **Non** : seul un paramètre de suivi (`ref`) est documenté, donc message copié aussi |
| LinkedIn, TikTok, Telegram, X | Lien du profil | **Non** : profil ouvert et message copié |

Donc on peut faire pareil partout, mais seuls WhatsApp, SMS et email arrivent avec le message déjà écrit. Pour les autres, c'est « ouvrir la conversation, puis coller ». Ça reste rapide, mais c'est contraire à ta décision d'abandonner ces réseaux : à trancher.

**Problème à régler** : un message envoyé depuis le WhatsApp personnel du client, l'agent ne voit pas la réponse. Solution à vérifier : la **coexistence WhatsApp**, qui permet de relier le numéro WhatsApp Business du client à Djeli. Le client envoie le premier message d'un clic, le prospect répond, et l'agent peut alors continuer la conversation tout seul. Il faut un numéro déjà actif sur l'application WhatsApp Business ; la disponibilité en Afrique de l'Ouest reste à confirmer.

**Prudence** : au-delà d'une vingtaine de nouvelles conversations par jour, ou si des prospects signalent les messages, WhatsApp peut bloquer le numéro du client.

## Appels de prospection par IA

**Décision du 9 novembre : les appels passent par WhatsApp**, pas par les opérateurs. Ils ne sont pas illimités : le prospect doit d'abord autoriser l'appel (1 demande par 24 h, 2 par 7 jours au maximum), et Meta facture à la minute les appels lancés par l'entreprise. Détail à l'étape 14 de `SQUELETTE.md`. Ce qui suit sur Twilio et les lignes d'opérateur sert de solution de secours.

**Rôles** : Claude Code sert à **construire** Djeli. Pendant l'appel, c'est l'**API Claude** qui réfléchit, et une voix de synthèse (ElevenLabs) qui parle.

**Déroulé d'un appel**
1. **Avant** : un modèle Claude puissant prépare une fiche d'appel par prospect (qui il est, ce dont il a besoin, la phrase d'accroche, les objections probables, l'objectif : un rendez-vous).
2. **Pendant** : le modèle Claude le plus rapide (Haiku) converse en temps réel. Il peut consulter le Google Agenda du client, réserver un créneau et envoyer un récapitulatif WhatsApp au prospect.
3. **Après** : Claude résume l'appel, note l'intérêt du prospect, met sa fiche à jour et prévient le client sur WhatsApp.

**Architecture**

| | Option 1 : rapide à construire ⭐ | Option 2 : économique à grand volume |
|---|---|---|
| Orchestration | ElevenLabs Agents (plateforme) | LiveKit Agents (open source, gratuit) |
| Reconnaissance vocale | Incluse | Deepgram ou ElevenLabs Scribe |
| Cerveau | Claude Haiku, branché sur ElevenLabs | Claude Haiku |
| Voix | ElevenLabs (voix à l'accent d'Afrique francophone) | ElevenLabs Flash |
| Téléphonie | Twilio ou opérateur local (SIP) | Opérateur local (SIP) |
| Coût IA | ~0,08 $/min + Claude ~0,01 $/min | Moins cher, mais un serveur à gérer |

**Open source retenu** : seulement LiveKit Agents (ou Pipecat), pour l'orchestration. Les voix et la reconnaissance vocale open source en français demandent un serveur avec carte graphique, et restent moins naturelles qu'ElevenLabs au téléphone : écartées pour l'instant.

**Le vrai coût, c'est la ligne téléphonique** : chez Twilio, appeler un mobile coûte environ 0,61 $/min au Bénin, 0,66 $ au Sénégal et 0,73 $ en Côte d'Ivoire. Un appel de 3 minutes revient à environ **2,2 $ (≈ 1 350 FCFA)**, dont 1,9 $ de ligne. À négocier : une ligne professionnelle (SIP) chez un opérateur local (MTN, Moov, Celtiis, Orange), beaucoup moins chère par minute. Elle demande une société immatriculée. Les boîtiers à cartes SIM sont interdits par les régulateurs : à exclure.

**Conséquence sur le produit** : on n'appelle pas tout le monde à froid. On appelle **les prospects chauds** (ceux qui ont ouvert l'email, cliqué ou répondu « peut-être »), et on s'en sert pour confirmer les rendez-vous. Appels vendus en option ou inclus en quantité limitée dans l'offre Business.

**Règles**
- L'agent dit dès le début qu'il est un assistant virtuel (obligatoire dans l'Union européenne pour les échanges avec une IA, et indispensable pour la confiance)
- États-Unis : appel avec voix IA interdit sans accord écrit préalable (décision de la FCC en 2024) : pas d'appels vers les États-Unis
- France : vérifier la règle d'accord préalable pour le démarchage des particuliers, annoncée pour août 2026
- Afrique de l'Ouest : vrai numéro affiché, horaires raisonnables, arrêt immédiat si la personne refuse, liste d'opposition
- Voix clonée du client : possible avec son accord, mais l'agent annonce toujours qu'il est une IA

**Calendrier** : construit pour le lancement. Le compte ElevenLabs et la fonction d'appel WhatsApp sont à activer dès le premier jour.

## Points encore ouverts

- Lien ou documentation de **SaaSPay** (introuvable en ligne)
- Société béninoise **déjà immatriculée** ? Meta et les prestataires de paiement demandent des documents d'entreprise
- Messenger, Instagram et LinkedIn en « ouvrir puis coller » : on les garde ou on les abandonne ?
- Données de personnes : déclaration à l'APDP (autorité béninoise de protection des données), prévue par le Code du numérique
- Offre de départ et accroche (propositions dans le message du 8 novembre)

## Vérification (à chaque phase)

- `npm run build` et `npm run lint` sans erreur
- Landing ouverte dans le navigateur intégré, en largeur bureau et téléphone (375 px), contraste et accessibilité contrôlés
- Parcours inscription → démarrage → analyse testé de bout en bout sur une base Supabase de test
- Envoi testé uniquement vers nos propres adresses avant toute campagne réelle
- Paiements testés en mode sandbox des prestataires
