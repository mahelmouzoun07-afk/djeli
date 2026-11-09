# Module 06 : analyse de l'activité du client, profils cibles et aperçu

## Objectif
À partir d'un lien de site **ou** d'une description (avec cases à cocher), produire en moins d'une minute :
1. une fiche de l'activité du client,
2. 1 à 3 questions seulement si une information indispensable manque,
3. 3 à 5 profils de clients cibles,
4. un aperçu : le **vrai nombre** de prospects trouvés et une liste **sans noms, logos ni contacts**.

Tout ceci est **gratuit** (aucun crédit).

## Prérequis
Modules 01 à 04 terminés. Le module 07 (annuaire) peut ne pas être fini : l'aperçu utilise alors une fonction de comptage temporaire qui renvoie 0, à remplacer au module 07.

## À faire

### 1. Lecture de site `src/lib/donnees/lecteur-site.ts`
- `lireSite(url)` : vérifie l'URL (http/https seulement, refuse les IP privées, `localhost` et les ports exotiques pour éviter les attaques SSRF), suit 3 redirections au maximum, délai de 10 s, taille maximale 2 Mo
- Lit la page d'accueil + jusqu'à 5 pages internes utiles (à propos, services, produits, tarifs, contact), repérées par les liens
- Extrait avec `cheerio` : titre, description, texte principal, emails, téléphones, liens vers les réseaux sociaux, langue
- Respecte `robots.txt` ; User-Agent : `DjeliBot/1.0 (+https://djeliai.com/robot)`
- Si le texte récupéré est presque vide (site fait en JavaScript) : seconde tentative avec Playwright (dans une tâche Trigger.dev, pas dans une requête web)

### 2. Prompts `src/lib/ia/prompts/`
- Un fichier par prompt, en français, versionné (`VERSION = "2026-11-v1"`), stocké avec le résultat
- `analyse-activite.ts` : sortie JSON validée par zod :
  `{ nom, resume, offres[], prix_indicatifs?, clientele_actuelle, zone_geographique[], arguments_forts[], preuves[], ton, langues[], b2b_ou_b2c, informations_manquantes[] }`
- `questions.ts` : à partir de `informations_manquantes`, 0 à 3 questions courtes, chacune avec des choix à cocher et une option « Autre »
- `profils-cibles.ts` : 3 à 5 profils `{ nom, type_cible, secteurs[], tailles[], pays[], villes[], signaux_achat[], angle, pourquoi }`. Les secteurs doivent utiliser **la liste de catégories de l'annuaire** (fournie dans le prompt), sinon la recherche ne trouve rien
- Règle dans chaque prompt : n'invente rien ; si une information n'est pas dans la source, la laisser vide

### 3. Client IA `src/lib/ia/client.ts`
- `appelerClaude({ modele, systeme, message, schema })` : demande du JSON, valide avec zod, une nouvelle tentative avec l'erreur de validation si besoin
- Utilise la mise en cache des prompts (prompt caching) pour les parties fixes
- Enregistre pour chaque appel : modèle, jetons entrée et sortie, durée, coût estimé, dans `journal_evenements` (`type = 'appel_ia'`). Indispensable pour suivre nos coûts

### 4. Server Actions `src/app/actions/analyse.ts` (utilisables sans être connecté)
- `lancerAnalyse({ entree, typeEntree: 'lien' | 'description', cases?: {...}, pays })` → crée une `analyses_anonymes` et renvoie son `jeton`
- `repondreQuestions({ jeton, reponses })`
- `obtenirAnalyse({ jeton })` → état (`en_cours`, `questions`, `pret`) + résultat
- Si l'utilisateur est connecté : écrire directement dans `entreprises.analyse` et `profils_cibles`
- Protection contre l'abus : 5 analyses par IP et par heure, 20 par jour

### 5. Aperçu `src/lib/donnees/apercu.ts`
- `construireApercu(profilsCibles)` → pour chaque profil : nombre exact de prospects dans l'annuaire + 10 exemples **masqués** : `{ secteur, ville, taille, signal }` (jamais de nom, logo, email, téléphone ni site)

### 6. Si l'analyse est longue
Exécuter dans une tâche Trigger.dev (`src/trigger/analyse-activite.ts`) et faire suivre l'état par l'interface (lecture toutes les 2 s, ou Supabase Realtime).

## Tests
- `lireSite` refuse `http://127.0.0.1`, `http://169.254.169.254`, `file:///`
- Une réponse IA mal formée déclenche une seconde tentative puis une erreur propre
- L'aperçu ne contient jamais de nom, email, téléphone ni URL (test sur la forme des données)
- Avec un site de test local (fichiers HTML dans `tests/fixtures/`), l'analyse remplit `offres` et `zone_geographique`

## Critères d'acceptation
- [ ] Analyse d'un vrai site en moins de 60 s
- [ ] Une description de 2 lignes donne des questions, puis des profils cibles
- [ ] Le coût de chaque analyse est visible dans `journal_evenements`
