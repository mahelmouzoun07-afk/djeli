# Registre des sources de l'annuaire Djeli

Ce registre liste **toutes** les sources prévues, avec la façon d'y accéder et ce qu'on a le droit d'en faire. Harness s'en sert pour remplir la table `sources` (module 07A). Le `code` de chaque ligne ne change jamais.

## Les statuts

| Statut | Signification | Ce que Harness fait |
|---|---|---|
| 🟢 **Autorisé** | Données ouvertes, API officielle ou publication publique | Il code le connecteur et l'active |
| 🟡 **Sous conditions** | Il faut une licence payante, un accord, une validation de l'application ou une vérification des conditions d'utilisation | Il code le connecteur, mais **désactivé**. Tu l'actives quand la condition est remplie |
| 🔴 **Pas d'extraction automatique** | Les conditions interdisent la copie en masse, ou il n'y a aucun accès légal | Pas de robot. On garde seulement les **liens** trouvés ailleurs, une saisie à la main, ou un partenariat à négocier |

« À vérifier » : je n'ai pas pu confirmer les conditions d'utilisation. Le statut reste 🟡 tant que quelqu'un ne les a pas lues.

## Les vagues (ordre de construction)

1. **Vague 1 : le socle** : cartes ouvertes + identifiants mondiaux gratuits
2. **Vague 2 : l'identité légale** : registres, guichets, journaux officiels
3. **Vague 3 : les listes officielles et les marchés** : agréments par secteur, marchés publics, bourses, chambres, salons
4. **Vague 4 : l'empreinte web** : domaines, sites, technologies, applications
5. **Vague 5 : les signaux** : réseaux sociaux et publicité, par les API officielles
6. **Vague 6 : nos sources** : annuaire gratuit, imports, ambassadeurs, partenaires, particuliers qui ont donné leur accord

---

## 1. Cartes et lieux

| Code | Source | Accès | Licence et conditions | Statut | Ce qu'on garde | Mise à jour | Vague |
|---|---|---|---|---|---|---|---|
| `overture` | Overture Maps Places | Fichiers Parquet (DuckDB) | CDLA Permissive 2.0 | 🟢 | Tout : nom, catégorie, adresse, position, téléphone, site, réseaux, score de confiance | À chaque version (environ mensuelle) | 1 |
| `foursquare_os` | Foursquare OS Places | Fichiers Parquet | Apache 2.0 | 🟢 | Tout, dont la date de fermeture | Mensuelle | 1 |
| `osm` | OpenStreetMap (extraits Geofabrik par pays) | Fichiers `.osm.pbf` | ODbL : mention « © contributeurs OpenStreetMap » ; si on **publie** une base qui en dérive, elle doit rester sous ODbL | 🟢 | Tout, avec la provenance pour pouvoir isoler ces données | Hebdomadaire | 1 |
| `overpass` | API Overpass (OSM) | API, petites requêtes | Usage raisonnable des serveurs publics | 🟢 | Requêtes ciblées par ville, pour combler les trous | À la demande | 1 |
| `google_places` | Google Places API (New) | API payante, à la demande | Seul le `place_id` peut être conservé ; le reste est demandé au moment du besoin | 🟢 sous règle stricte | `place_id` uniquement | Jamais stocké | 1 |
| `mapbox_geo` | Mapbox Geocoding (mode permanent) | API payante | Le mode « permanent » autorise la conservation des résultats | 🟡 compte payant | Coordonnées des adresses de registres | À la demande | 2 |
| `here` | HERE | API sous contrat | Conservation selon le contrat | 🟡 à vérifier | Géocodage seulement | — | plus tard |
| `tomtom` | TomTom | API sous contrat | Conservation selon le contrat | 🟡 à vérifier | Géocodage seulement | — | plus tard |
| `yango_maps` | Yango Maps | API à confirmer | À vérifier | 🟡 à vérifier | — | — | plus tard |

## 2. Identité légale

| Code | Source | Accès | Licence et conditions | Statut | Ce qu'on garde | Mise à jour | Vague |
|---|---|---|---|---|---|---|---|
| `gleif` | GLEIF (identifiants LEI) | Fichier complet quotidien | CC0 (libre) | 🟢 | LEI, nom légal, forme, statut, adresses, maison mère et filiales | Hebdomadaire | 1 |
| `wikidata` | Wikidata | Requêtes SPARQL | CC0 (libre) | 🟢 | Nom, site, LEI, date de création, siège, secteur, identifiants de réseaux sociaux | Mensuelle | 1 |
| `rccm_ohada` | Portail RCCM de l'OHADA | Recherche unitaire sur le portail | Conditions d'usage automatisé à vérifier ; demander une convention | 🟡 à vérifier | Numéro RCCM, forme, statut, siège | Vérification à la demande | 2 |
| `apiex_bj` | APIEx / guichet unique (Bénin) | Publications et recherche | À vérifier ; demander une convention | 🟡 à vérifier | Créations d'entreprises, RCCM, IFU | Mensuelle | 2 |
| `cepici_ci` | CEPICI (Côte d'Ivoire) | Publications et recherche | À vérifier ; demander une convention | 🟡 à vérifier | Créations d'entreprises | Mensuelle | 2 |
| `apix_sn` | APIX (Sénégal) | Publications et recherche | À vérifier ; demander une convention | 🟡 à vérifier | Créations d'entreprises | Mensuelle | 2 |
| `guichets_autres` | Guichets uniques des autres pays | Selon le pays | À vérifier pays par pays | 🟡 à vérifier | Créations d'entreprises | Mensuelle | 2 |
| `journaux_officiels` | Journaux officiels et annonces légales | Documents PDF publics | Publications légales publiques | 🟢 si le document est public | Créations, modifications, dissolutions, dirigeants (nom et fonction) | Hebdomadaire | 2 |
| `stat_repertoires` | Répertoires statistiques (IFU au Bénin, NINEA au Sénégal, NCC en Côte d'Ivoire, recensements d'entreprises) | Publications des instituts | Souvent agrégé ; fichiers nominatifs rarement publics | 🟡 à vérifier | Identifiants fiscaux et secteurs quand ils sont publiés | Annuelle | 2 |
| `cac_ng` | CAC (Nigeria) | Recherche publique ; API pour partenaires | À vérifier | 🟡 à vérifier | Immatriculation, statut, dirigeants | À la demande | 2 |
| `orc_gh` | ORC (Ghana) | Recherche publique | À vérifier | 🟡 à vérifier | Immatriculation, statut | À la demande | 2 |
| `opencorporates` | OpenCorporates | API avec clé | Données ouvertes avec partage à l'identique ; **usage commercial = licence payante** | 🟡 licence | Identifiant, statut, lien vers le registre | Mensuelle | 2 |
| `registres_hors_zone` | CIPC, BRS, RDB, CBRD, OMPIC, RNE, GAFI | Selon le pays | À vérifier | 🟡 hors zone | — | — | plus tard (hors Afrique de l'Ouest) |

## 3. Listes officielles par secteur

Ces listes sont publiées en PDF, en Excel ou en pages web. Elles passent par l'**outil d'import de documents** (module 07E) : extraction, relecture par un humain, puis rapprochement avec l'annuaire.

| Code | Source | Secteur | Statut | Vague |
|---|---|---|---|---|
| `bceao_banques` | BCEAO : banques et établissements financiers agréés | Banque | 🟢 | 3 |
| `bceao_sfd` | BCEAO : systèmes financiers décentralisés (microfinance) | Microfinance | 🟢 | 3 |
| `cima_assurances` | CIMA et directions nationales des assurances | Assurance | 🟢 | 3 |
| `regulateurs_telecom` | ARCEP Bénin, ARTCI, ARTP Sénégal et autres | Télécoms, fournisseurs Internet | 🟢 | 3 |
| `sante_etablissements` | Ministères de la Santé : cliniques, laboratoires, hôpitaux privés | Santé | 🟢 | 3 |
| `ordres_pharmaciens` | Ordres des pharmaciens : officines | Pharmacie | 🟢 (on garde l'officine) | 3 |
| `education_agrees` | Ministères de l'Éducation : écoles, universités, centres de formation agréés | Éducation | 🟢 | 3 |
| `tourisme_agrees` | Ministères du Tourisme : agences, hôtels classés | Tourisme | 🟢 | 3 |
| `transport_logistique` | Ports, douanes, fédérations : transitaires agréés | Logistique | 🟢 | 3 |
| `immobilier_agrees` | Agences et promoteurs agréés | Immobilier | 🟢 | 3 |
| `cooperatives` | Registres des coopératives, ministères de l'Agriculture | Coopératives | 🟢 | 3 |
| `ordres_professionnels` | Experts-comptables, avocats, architectes, médecins | Professions libérales | 🟡 : ce sont des **personnes** ; on garde le cabinet, et la personne seulement avec une base légale documentée | 3 |
| `open_data_nationaux` | Portails de données ouvertes des États | Divers | 🟢 selon la licence de chaque jeu | 3 |

## 4. Marchés publics, bourses et réseaux d'affaires

| Code | Source | Accès | Statut | Ce qu'on garde | Vague |
|---|---|---|---|---|---|
| `banque_mondiale_contrats` | Banque mondiale : contrats attribués | API de données ouvertes | 🟢 (CC BY 4.0) | Attributaire, acheteur, montant, date, secteur | 3 |
| `bad_marches` | Banque africaine de développement : avis d'attribution | Pages et PDF publics | 🟢 si public | Attributaire, projet, montant | 3 |
| `ungm_attributions` | UNGM : attributions de contrats de l'ONU | Pages publiques | 🟡 à vérifier (la base des fournisseurs n'est **pas** publique) | Attributions seulement | 3 |
| `marches_publics_nationaux` | ARMP Bénin, ARMP/DCMP Sénégal, ANRMP Côte d'Ivoire et autres | Portails publics | 🟡 à vérifier portail par portail | Acheteurs, attributaires, montants | 3 |
| `bourses` | BRVM, NGX, GSE | Listes publiques | 🟢 | Sociétés cotées, secteurs | 3 |
| `douanes` | Données douanières | Seulement les statistiques officielles publiées | 🔴 pour les listes nominatives non publiques | Statistiques par produit et par pays | 3 |
| `chambres_patronats` | CCI, CGECI, CNP, CNES et autres | Listes de membres publiées | 🟡 à vérifier liste par liste | Entreprises membres | 3 |
| `salons` | Salons, foires, conférences | Catalogues d'exposants publiés | 🟡 à vérifier événement par événement | Entreprises exposantes ou sponsors | 3 |

## 5. Empreinte web

| Code | Source | Accès | Statut | Ce qu'on garde | Mise à jour | Vague |
|---|---|---|---|---|---|---|
| `ct_logs` | Certificate Transparency (crt.sh) | API publique | 🟢 | Nouveaux domaines et sous-domaines en `.bj`, `.sn`, `.ci`, `.tg`… | Quotidienne | 4 |
| `tranco` | Liste Tranco | Fichier public | 🟢 | Rang de popularité du domaine | Hebdomadaire | 4 |
| `crux` | Chrome UX Report | API Google (clé) | 🟢 | Le site a-t-il du trafic mesurable, est-il rapide ? | Mensuelle | 4 |
| `common_crawl` | Index Common Crawl | Fichiers publics | 🟢 (on garde des faits, pas le contenu des pages) | Domaines découverts, pages « contact » | À chaque version | 4 |
| `rdap` | RDAP (remplace WHOIS) | API publique des registres | 🟢 pour la date ; 🔴 pour les contacts personnels | Date de création du domaine uniquement | À la découverte | 4 |
| `czds` | Fichiers de zone ICANN (CZDS) | Sur demande | 🔴 : le contrat d'accès interdit de s'en servir pour de la prospection commerciale, et les domaines africains (`.bj`, `.sn`…) n'y sont pas | — | — | non |
| `sites_entreprises` | Sites officiels des entreprises | Lecture polie (robots.txt) | 🟢 | Contacts **génériques**, lien WhatsApp, RCCM/IFU affichés, liens vers les réseaux, services | Tous les 90 jours | 4 |
| `technologies_web` | Détection des technologies sur le site | Notre propre lecture | 🟢 | Shopify, WooCommerce, WordPress, Wix, Paystack, Flutterwave, CinetPay, FedaPay, Stripe, pixels pub… | Tous les 90 jours | 4 |
| `app_store` | App Store (API de recherche d'Apple) | API publique | 🟢 | Applications, éditeur, catégorie | Mensuelle | 4 |
| `google_play` | Google Play | Pas d'API publique de recherche | 🔴 automatique ; 🟢 lien trouvé sur le site | Lien vers l'application | — | 4 |

## 6. Réseaux sociaux et publicité

**Règle** : on ne prend sur un réseau que ce que son **API officielle** permet. Sinon, on garde seulement le lien trouvé sur le site officiel de l'entreprise. On s'en sert pour **qualifier** un prospect, pas pour le contacter sur ce réseau.

| Code | Source | Accès | Statut | Ce qu'on garde | Vague |
|---|---|---|---|---|---|
| `youtube` | YouTube Data API | API avec clé, quota quotidien | 🟢 ; les conditions demandent de rafraîchir ou supprimer les données au bout de 30 jours | Chaîne, abonnés, nombre de vidéos, dernière publication | 5 |
| `instagram_business` | Instagram Business Discovery | API Meta, validation de l'application | 🟡 validation Meta | Comptes **professionnels** : bio, catégorie, site, abonnés | 5 |
| `facebook_pages` | Pages Facebook publiques | API Graph, accès soumis à validation | 🟡 validation Meta | Catégorie, site, téléphone, adresse | 5 |
| `meta_ad_library` | Bibliothèque publicitaire Meta | L'API ne couvre que les pubs politiques et celles diffusées dans l'UE ; le robot est interdit | 🔴 automatique ; 🟢 saisie à la main par l'équipe | Signal « fait de la publicité » | 5 |
| `google_ads_transparency` | Centre de transparence Google Ads | Pas d'API | 🔴 automatique ; 🟢 saisie à la main | Signal « fait de la publicité » | 5 |
| `linkedin` | LinkedIn | Pas d'API de recherche pour nous ; robot interdit | 🔴 | Lien de la page entreprise trouvé sur le site | 5 |
| `tiktok` | TikTok | API de recherche réservée aux chercheurs | 🔴 | Lien trouvé sur le site | 5 |
| `x_twitter` | X | API payante | 🟡 abonnement | Lien trouvé sur le site | plus tard |
| `telegram` | Canaux Telegram publics | API officielle | 🟡 à vérifier | Nom, sujet, taille du canal (pas les membres) | plus tard |

## 7. Annuaires, petites annonces, emploi, startups

**Leurs conditions interdisent presque toujours la copie en masse.** On ne code donc pas de robot. Pour chacun : partenariat ou licence à négocier.

| Code | Sources | Statut | Ce qu'on fait |
|---|---|---|---|
| `annuaires_b2b` | Kompass, Africa Business Pages, Go Africa Online, Pages Jaunes, Telecontact, Cylex, Brabys, BusinessList | 🔴 robot / 🟡 licence | Demander une licence de données ou un échange |
| `petites_annonces` | CoinAfrique, Expat-Dakar, Jiji | 🔴 robot / 🟡 partenariat | Partenariat |
| `marketplaces` | Jumia, Glovo, Yango Deli, TripAdvisor, Booking | 🔴 robot / 🟡 partenariat | Partenariat ; programmes partenaires officiels |
| `emploi` | ReKrute, Emploi.sn, Educarriere, Novojob, Jobberman, BrighterMonday | 🔴 robot / 🟡 flux officiel | Signal « recrute » via les flux officiels quand ils existent, sinon via la page « carrières » du site de l'entreprise |
| `startups` | Briter Bridges, Crunchbase, Africa: The Big Deal | 🟡 licence payante | Licence plus tard |
| `incubateurs` | Portefeuilles publiés par les incubateurs et les fonds | 🟢 si publié | Outil d'import de documents |

## 8. Nos sources (la valeur qui n'appartient qu'à Djeli)

| Code | Source | Base légale | Statut | Vague |
|---|---|---|---|---|
| `inscription_annuaire` | « Inscrivez votre entreprise » (gratuit) | Consentement de l'entreprise | 🟢 | 6 |
| `import_client` | Fichiers importés par un client (CRM, Excel) | Le client en est responsable ; **visible par lui seul** | 🟢 | 6 |
| `ambassadeurs` | Vérifications sur le terrain | Contrat avec l'ambassadeur ; accord de la personne pour ses coordonnées | 🟢 | 6 |
| `partenaires` | Opérateurs Mobile Money, CCI, associations, incubateurs, écoles | Accord de partenariat écrit | 🟡 un accord par partenaire | 6 |
| `formulaires_b2c` | Formulaires d'inscription de particuliers | Consentement explicite | 🟢 | 6 |
| `parrainage` | Parrainage | Le filleul reçoit une invitation et n'est gardé que s'il accepte | 🟢 | 6 |

## 9. Statistiques (pour mesurer les marchés, jamais pour contacter)

| Code | Source | Statut | Ce qu'on garde |
|---|---|---|---|
| `banque_mondiale_wdi` | Indicateurs de la Banque mondiale (API) | 🟢 | Population, urbanisation, accès à Internet, par pays |
| `instituts_stat` | INStaD (Bénin), ANSD (Sénégal), INS (Côte d'Ivoire) et autres | 🟢 | Population et activité par région et ville |
| `regulateurs_stats` | Statistiques des régulateurs télécoms | 🟢 | Abonnés mobile et Internet, par pays |
| `rapports_payants` | GSMA Intelligence, DataReportal, Statista | 🟡 droits d'auteur | Quelques chiffres cités à la main, avec la source |

## Ce qu'on ne fera pas, quelle que soit la source
- Acheter ou récupérer des listes de numéros de particuliers
- Copier en masse un site dont les conditions l'interdisent
- Garder les données Google autres que le `place_id`
- Garder les contacts personnels issus du WHOIS
- Garder des données sensibles : pièce d'identité, santé, religion, position précise d'une personne
