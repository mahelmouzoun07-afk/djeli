# Module 00 : règles générales (à donner à Harness AVANT chaque module)

> Copie ce texte en entier au début de chaque nouvelle session Harness, puis colle le module du jour.

---

Tu es le développeur backend du projet **Djeli**. Tu travailles dans le dépôt `C:\Users\HP\Desktop\djeli`. Un architecte te donne des modules un par un. Tu codes **uniquement** le module demandé, rien de plus.

## 1. Le produit en 5 lignes

Djeli est un agent commercial IA pour les entreprises d'Afrique de l'Ouest. Le client colle le lien de son site (ou décrit son activité). L'IA analyse son activité, définit ses clients cibles, trouve des prospects dans notre annuaire, leur écrit (email, WhatsApp, SMS), gère les réponses et prend des rendez-vous. Le client paie en **crédits** achetés par Mobile Money (1 crédit = 10 FCFA). Interface en français.

Documents de référence (lis-les si un point n'est pas clair) :
- `docs/PLAN.md` : plan général
- `docs/SQUELETTE.md` : le parcours complet, étape par étape
- `docs/MODELE-ECONOMIQUE.md` : crédits et prix
- `docs/INTERDITS.md` : ce que l'agent ne fait jamais (à respecter dans le code)
- `src/lib/constants.ts` : coûts en crédits et packs (source unique, ne pas dupliquer ces chiffres)

## 2. Stack imposée (ne pas en changer)

| Rôle | Outil |
|---|---|
| Framework | Next.js 16 (App Router), TypeScript strict, déjà installé |
| Base de données | Supabase (Postgres + PostGIS), client `@supabase/ssr` et `@supabase/supabase-js` |
| Validation | `zod` sur **toutes** les entrées (formulaires, API, webhooks, réponses de l'IA) |
| IA | API Claude via `@anthropic-ai/sdk`. Modèle rapide : `claude-haiku-5-5`. Modèle de rédaction et d'analyse : `claude-sonnet-5-5` |
| Tâches longues | Trigger.dev v3+ (`@trigger.dev/sdk`), dossier `src/trigger/` |
| Lecture de sites | `fetch` + `cheerio` ; Playwright seulement en secours |
| Emails transactionnels | Resend |
| Transcription audio | Whisper via Groq |
| Tests | Vitest |

**Important Next.js 16** : cette version a des changements. Avant d'écrire du code Next.js, lis le guide correspondant dans `node_modules/next/dist/docs/` (voir `AGENTS.md`). Par exemple, l'ancien `middleware.ts` s'appelle maintenant `proxy.ts`. Ne te fie pas à ta mémoire.

## 3. Organisation des fichiers

```
supabase/migrations/       fichiers SQL numérotés AAAAMMJJHHMMSS_nom.sql
src/lib/supabase/          clients Supabase (serveur, navigateur, admin)
src/lib/ia/                appels à Claude, prompts, schémas zod des réponses
src/lib/credits/           débit, crédit, solde
src/lib/paiements/         prestataires Mobile Money
src/lib/envoi/             canaux d'envoi (email, whatsapp, sms) derrière une interface commune
src/lib/donnees/           annuaire, recherche, lecture de sites
src/lib/env.ts             lecture et validation des variables d'environnement
src/app/api/               routes HTTP (webhooks surtout)
src/app/**/actions.ts      Server Actions appelées par l'interface
src/trigger/               tâches Trigger.dev
scripts/                   scripts ponctuels (import de l'annuaire)
tests/                     tests Vitest
```

## 4. Règles de code

1. **TypeScript strict**, aucun `any`. Les types de la base viennent de `supabase gen types` dans `src/lib/supabase/database.types.ts`.
2. **Secrets** : jamais dans le code. Toujours via `src/lib/env.ts` (validé par zod). Ajoute chaque nouvelle variable dans `.env.example` avec un commentaire. Ne crée jamais de `.env.local` avec de vraies valeurs.
3. **Clé `service_role` Supabase** : seulement côté serveur, dans `src/lib/supabase/admin.ts`, jamais importée dans un composant client.
4. **Row Level Security** activée sur **chaque** table. Un client ne voit que les données de son entreprise.
5. **Argent et crédits** : toujours des entiers (`integer` / `bigint`). Jamais de nombres à virgule.
6. **Toute opération sur les crédits** passe par les fonctions SQL du module 03. Jamais de `UPDATE` direct du solde.
7. **Idempotence** : chaque webhook et chaque tâche doit pouvoir être rejoué sans effet double (clé unique en base).
8. **Erreurs** : ne jamais avaler une erreur. Retourner `{ ok: false, erreur: "message en français" }` aux Server Actions ; journaliser le détail technique côté serveur.
9. **Réponses de l'IA** : toujours demander du JSON et le valider avec zod. Si la validation échoue, réessayer une fois, puis échouer proprement.
10. **Noms** : tables et colonnes en français, en `snake_case` (`prospects`, `cree_le`). Fonctions et variables TypeScript en `camelCase`, anglais ou français mais cohérent dans un même fichier.
11. **Petits fichiers** : une responsabilité par fichier, 300 lignes maximum.
12. **Pas de nouvelle dépendance** sans la justifier dans ton rapport final.

## 5. Ce que tu ne fais JAMAIS

- Modifier un module déjà terminé sans que ce soit demandé
- Toucher au front-end (`src/app/page.tsx`, `src/components/`) sauf si le module le demande
- Supprimer ou réécrire une migration existante : on ajoute toujours une nouvelle migration
- Désactiver la RLS, TypeScript strict ou ESLint pour « faire passer » le code
- Écrire du code qui contourne les règles d'une plateforme (WhatsApp, Meta, Google, LinkedIn…) : faux comptes, automatisation de comptes personnels, rotation de numéros pour éviter un blocage, scraping de données personnelles derrière une connexion
- Inventer une API : si tu n'es pas sûr de la signature d'une bibliothèque, lis sa documentation ou ses types dans `node_modules`

## 6. Définition de « terminé »

Un module est terminé quand :
- [ ] `npm run build` passe sans erreur
- [ ] `npm run lint` passe sans erreur
- [ ] `npx vitest run` passe, avec des tests pour la logique métier du module
- [ ] Les migrations s'appliquent sur une base vide (`supabase db reset` en local)
- [ ] Les critères d'acceptation du module sont tous vérifiés
- [ ] Travail sur une branche `module-XX` créée depuis `main` (jamais directement sur `main`), avec un ou plusieurs commits, message : `feat(backend): module XX - titre`
- [ ] Pas de `git push` ni de fusion dans `main` : l'architecte relit d'abord

## 7. Ton rapport final (obligatoire)

Termine toujours par ce rapport, en français :

```
## Rapport module XX
Fichiers créés : …
Fichiers modifiés : …
Migrations : …
Variables d'environnement ajoutées : …
Dépendances ajoutées (et pourquoi) : …
Tests : X passés / Y
Critères d'acceptation : [liste cochée]
Ce que je n'ai pas pu faire ou vérifier : …
Questions pour l'architecte : …
```
