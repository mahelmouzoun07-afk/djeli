# Module 07F : vagues 4 et 5, l'empreinte web et les signaux

## Objectif
Savoir quelles entreprises sont **en ligne**, à quel point elles sont **digitalisées**, et lesquelles **investissent** (publicité, application, vente en ligne, recrutement). Ces signaux servent à prioriser les prospects (module 08) et à écrire une meilleure accroche (module 09).

## Prérequis
Modules 07B et 07C terminés. Lecteur de site du module 06 (`lireSite`) disponible.

## Règle
On ne prend sur un réseau social **que ce que son API officielle permet**. Sinon, on garde uniquement le **lien** trouvé sur le site officiel de l'entreprise. Ne code aucun robot pour LinkedIn, TikTok, Google Play, la bibliothèque publicitaire Meta ou Google Ads Transparency.

## À faire

### 1. Découverte de domaines
- `ct_logs.ts` (tâche quotidienne) : interroge crt.sh pour chaque domaine national (`.bj`, `.sn`, `.ci`, `.tg`, `.bf`, `.ml`, `.ne`, `.gn`, `.gh`, `.ng`…) et les certificats des dernières 24 h ; garde le domaine enregistrable (pas les sous-domaines techniques : `mail.`, `cpanel.`, `webmail.`, `autodiscover.`…) → table `domaines_decouverts` (migration : `domaine`, `pays`, `premier_certificat_le`, `source_code`, `statut` : `a_visiter`, `entreprise`, `pas_entreprise`, `injoignable`). Si crt.sh ne répond pas : nouvelle tentative le lendemain, sans bloquer
- `common_crawl.ts` (script) : lit l'index en colonnes de la dernière version de Common Crawl avec DuckDB, filtré sur les domaines nationaux → `domaines_decouverts`
- `tranco.ts` (hebdomadaire) : télécharge la liste, met à jour `presence_numerique.rang_tranco` pour les domaines connus
- `rdap.ts` : date de création du domaine uniquement (aucun contact) → `presence_numerique.domaine_cree_le`

### 2. Visite des sites `src/trigger/visiter-site.ts`
- Pour chaque domaine `a_visiter` et chaque entreprise ayant un site, tous les 90 jours :
  - Le site répond-il ? Sinon, 3 échecs de suite → `site_actif = false`
  - C'est une entreprise ? Claude (`claude-haiku-5-5`) classe la page d'accueil : `entreprise`, `association`, `administration`, `media`, `personnel`, `parking` (domaine en vente), `autre`
  - Extraction : nom, activité, ville, contacts **génériques**, lien WhatsApp (`wa.me`, `api.whatsapp.com`), RCCM / identifiant fiscal affichés, liens vers les réseaux sociaux, liens vers les stores d'applications, page « carrières » (→ signal `recrute` si des offres sont listées)
  - Rapprochement (module 07B) : nouvelle entreprise ou entreprise existante enrichie
- Si le domaine a été découvert récemment (moins de 60 jours) → signal `nouveau_site`

### 3. Détection des technologies `src/lib/donnees/technologies.ts`
- Règles dans `src/lib/donnees/technologies-regles.ts` (motifs dans le HTML, les scripts, les en-têtes) : WordPress, WooCommerce, Shopify, Wix, Squarespace, Webflow, Joomla ; paiements Paystack, Flutterwave, CinetPay, FedaPay, Kkiapay, PayDunya, Stripe, PayPal, Wave ; Meta Pixel, Google Analytics, Google Tag Manager, TikTok Pixel, HubSpot, Zoho, Tawk.to, Crisp
- Résultat dans `presence_numerique.technologies` et `paiements_en_ligne` ; paiement en ligne présent → signal `vend_en_ligne` ; pixel publicitaire présent → indice (pas un signal certain) dans le détail

### 4. Qualité du site
- `crux.ts` (mensuel) : API Chrome UX Report pour les domaines connus ; présence de données = le site a un trafic mesurable → `crux_present`

### 5. Applications
- `app_store.ts` : API publique de recherche et de consultation d'Apple, pour les liens trouvés sur les sites et pour une recherche par nom d'entreprise dans le store du pays → `presence_numerique.applis`, signal `a_une_appli`
- Google Play : on garde seulement le lien trouvé sur le site

### 6. Réseaux sociaux (API officielles)
- `youtube.ts` : pour les chaînes liées depuis un site officiel ou Wikidata : abonnés, nombre de vidéos, date de la dernière vidéo → `donnees_youtube` avec `donnees_youtube_expire_le` = +30 jours (règle des conditions de YouTube) ; une tâche quotidienne efface ou rafraîchit les données expirées. Quota quotidien surveillé
- `instagram_business.ts` et `facebook_pages.ts` : codés mais **désactivés** (validation de l'application Meta nécessaire). Seulement pour les comptes liés depuis le site officiel
- Signal manuel `fait_de_la_pub` : Server Action admin `ajouterSignalManuel({ entrepriseId, type, preuve })` pour l'équipe qui consulte à la main la bibliothèque publicitaire Meta ou Google

## Tests
- Les sous-domaines techniques sont ignorés
- Un domaine « parking » n'est pas transformé en entreprise
- La détection trouve WooCommerce et Paystack sur une page d'exemple (fixture)
- Les données YouTube expirées sont effacées par la tâche quotidienne
- Aucun code n'appelle linkedin.com, tiktok.com ou play.google.com (test par recherche dans le code)

## Critères d'acceptation
- [ ] 1 000 domaines `.bj` et `.sn` découverts et visités
- [ ] Rapport : part des entreprises avec site actif, avec paiement en ligne, avec WhatsApp affiché, par pays
