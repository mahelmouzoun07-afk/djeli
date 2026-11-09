# Tests de base de données (Supabase local)

Ces tests tapent sur une vraie instance Supabase locale. Ils sont **sautés**
automatiquement quand les variables d'environnement ne sont pas définies.

## Comment les lancer

1. Lance Supabase :
   ```
   npm run db:start
   ```
2. Note les valeurs affichées par `npx supabase status` : `API URL`, `anon key`
   et `service_role key`.
3. Exporte-les avant `npm test` :
   - Windows (PowerShell) :
     ```
     $env:TEST_SUPABASE_URL = "http://127.0.0.1:54321"
     $env:TEST_SUPABASE_ANON_KEY = "..."
     $env:TEST_SUPABASE_SERVICE_ROLE_KEY = "..."
     npm test
     ```
   - Linux / macOS :
     ```
     TEST_SUPABASE_URL=http://127.0.0.1:54321 \
     TEST_SUPABASE_ANON_KEY=... \
     TEST_SUPABASE_SERVICE_ROLE_KEY=... \
     npm test
     ```

## Pourquoi des variables à part

Les variables `TEST_SUPABASE_*` ne touchent jamais l'application réelle :
elles servent uniquement aux tests qui peuvent créer et supprimer des
utilisateurs et des lignes.
