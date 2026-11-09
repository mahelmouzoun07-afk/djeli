# Module 07 : l'annuaire (sommaire)

L'annuaire est découpé en 8 sous-modules. Donne-les à Harness **un par un**, dans cet ordre, chacun dans une nouvelle session, avec `00-REGLES-GENERALES.md` au début.

La liste complète des sources, avec leurs conditions d'accès, est dans `docs/sources/REGISTRE-DES-SOURCES.md`. Harness doit la lire avant chaque sous-module.

| Sous-module | Contenu | Dépend de |
|---|---|---|
| 07A | Le schéma : entreprises, lieux, contacts, provenances, listes, marchés, présence web, signaux, sources propres, particuliers, consentements | 02 |
| 07B | Le moteur : connecteurs, garde juridique, normalisation, rapprochement, fusion, retrait d'une source | 07A |
| 07C | Vague 1 : Overture, Foursquare, OpenStreetMap, GLEIF, Wikidata ; Google Places à la demande ; géocodage | 07B |
| 07D | Vague 2 : identité légale (journaux officiels, vérification au registre, OpenCorporates) | 07C |
| 07E | Vague 3 : outil d'import de documents, listes officielles, marchés publics, bourses, chambres, salons | 07D |
| 07F | Vagues 4 et 5 : domaines, visite des sites, technologies, applications, YouTube, signaux | 07C |
| 07G | Vague 6 : annuaire gratuit, imports clients, ambassadeurs, partenaires, particuliers consentants, statistiques | 07A, 07B, 04 |
| 07H | Qualité : scores, rafraîchissement, fermetures, droits des personnes, tableau de qualité | 07C |

07E, 07F et 07G peuvent avancer en parallèle une fois 07D terminé.

**Ce que le module 08 attend de l'annuaire** : les fonctions `chercher_annuaire` et `compter_annuaire` (07A), les signaux (07D à 07F) pour le score et l'accroche, et la règle sur les particuliers (07G).
