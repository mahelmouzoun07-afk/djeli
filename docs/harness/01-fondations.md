# Module 01 : fondations du backend

## Objectif
Préparer tout ce dont les autres modules ont besoin : variables d'environnement, clients Supabase, session utilisateur, tests. Aucune fonctionnalité métier ici.

## Prérequis
- Projet Next.js 16 déjà initialisé (ne pas le recréer)
- Supabase CLI via `npx supabase` (pas d'installation globale)

## À faire

### 1. Dépendances
```
npm install @supabase/supabase-js @supabase/ssr zod @anthropic-ai/sdk resend server-only
npm install -D vitest @vitest/coverage-v8 supabase
```

### 2. Supabase en local
- `npx supabase init` (crée `supabase/config.toml`)
- Scripts à ajouter dans `package.json` :
  - `"db:start": "supabase start"`
  - `"db:reset": "supabase db reset"`
  - `"db:types": "supabase gen types typescript --local > src/lib/supabase/database.types.ts"`
  - `"test": "vitest run"`

### 3. `src/lib/env.ts`
- Schéma zod séparé en deux :
  - `envServeur` : `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `GROQ_API_KEY`, `TRIGGER_SECRET_KEY`, `APP_URL`
  - `envPublic` : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Les clés pas encore utilisées sont `.optional()` ; chaque module rendra obligatoires celles dont il a besoin
- `import "server-only"` dans la partie serveur, pour empêcher son import côté navigateur
- Message d'erreur clair en français si une variable manque

### 4. `.env.example`
Toutes les variables ci-dessus, vides, avec un commentaire d'une ligne chacune (où la trouver).

### 5. Clients Supabase dans `src/lib/supabase/`
- `server.ts` : `creerClientServeur()` pour Server Components, Server Actions et routes (cookies via `next/headers`)
- `client.ts` : `creerClientNavigateur()` pour les composants client
- `admin.ts` : `creerClientAdmin()` avec la clé `service_role`, `import "server-only"`, à utiliser seulement dans les tâches de fond et les webhooks
- Suivre la documentation officielle `@supabase/ssr` pour Next.js App Router

### 6. Rafraîchissement de session : `src/proxy.ts`
- Lis d'abord la documentation de `proxy` (ex-`middleware`) dans `node_modules/next/dist/docs/`
- Rafraîchit la session Supabase à chaque requête
- Redirige vers `/connexion` toute visite non connectée sur : `/tableau-de-bord`, `/demarrage`, `/campagnes`, `/prospects`, `/messagerie`, `/credits`, `/parametres`
- Laisse passer `/`, `/connexion`, `/inscription`, `/api/webhooks/*` et les fichiers statiques

### 7. Utilitaires partagés
- `src/lib/resultat.ts` : type `Resultat<T> = { ok: true; donnees: T } | { ok: false; erreur: string }` et deux aides `succes()` et `echec()`
- `src/lib/journal.ts` : fonction `journal(niveau, message, contexte?)` qui écrit en JSON sur la console

### 8. Vitest
- `vitest.config.ts` avec l'alias `@/` vers `src/`
- Un test d'exemple sur `resultat.ts`

## Critères d'acceptation
- [ ] `npm run build`, `npm run lint`, `npm test` passent
- [ ] Sans `.env.local`, le message d'erreur dit en français quelle variable manque
- [ ] Une visite de `/tableau-de-bord` sans être connecté redirige vers `/connexion`
- [ ] Importer `admin.ts` dans un fichier `"use client"` fait échouer le build
