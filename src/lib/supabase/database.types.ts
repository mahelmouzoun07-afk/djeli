/**
 * Types générés depuis Supabase : `npm run db:types`.
 *
 * Le module 02 (schéma de la base) est le premier à utiliser Supabase
 * localement. Il regénère ce fichier et remplace cette définition par
 * les vrais types des tables.
 *
 * Le type `Database = unknown` ici force à passer par une assertion ou un
 * `select<T>()` dans ce module, mais fait compiler le projet sans dépendre
 * d'un Supabase lancé.
 */
export type Database = Record<string, unknown>;
