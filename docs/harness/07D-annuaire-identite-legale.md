# Module 07D : vague 2, l'identité légale

## Objectif
Distinguer une **vraie entreprise** d'un simple point sur une carte : numéro RCCM, identifiant fiscal, forme juridique, statut, date de création, dirigeants. Et repérer les **nouvelles entreprises** dès leur création.

## Prérequis
Modules 07B et 07C terminés.

## Ce qu'il faut savoir
- Les identifiants fiscaux changent selon le pays : **IFU** au Bénin, **NINEA** au Sénégal, **NCC** en Côte d'Ivoire, etc. Leur format est dans `pays_couverts`
- La plupart des registres d'Afrique de l'Ouest **n'ont pas d'API publique de téléchargement**. On construit donc trois outils au lieu de robots : la lecture des journaux officiels, la vérification à la demande, et l'import de listes publiées
- Les dirigeants sont des personnes : on garde **seulement** le nom et la fonction publiés, avec `base_legale = 'publication légale officielle'`

## À faire

### 1. Lecture des journaux officiels et annonces légales `src/lib/donnees/connecteurs/journaux_officiels.ts`
- Table `documents_sources` (migration) : `source_code`, `url`, `titre`, `publie_le`, `empreinte`, `fichier_url` (copie dans le bucket privé `documents-officiels`), `statut` (`a_traiter`, `traite`, `erreur`)
- Récupère les PDF publics des sites officiels configurés (liste d'URL par pays dans `src/lib/donnees/sources-documents.ts`, vide au départ, remplie par l'équipe)
- Extraction du texte (`unpdf`) ; si le PDF est une image, marquer `erreur` avec la raison « PDF scanné » (pas de reconnaissance de texte pour l'instant)
- Découpage en annonces, puis extraction par Claude (`claude-haiku-5-5`) en JSON validé : `{ type: creation | modification | dissolution | changement_dirigeant | autre, nom, forme_juridique, capital, siege, ville, rccm, identifiant_fiscal, dirigeants: [{ nom, fonction }], date }`
- Pour chaque annonce : rapprochement (module 07B), mise à jour de l'entreprise, signal `nouvelle_entreprise`, `changement_dirigeant` ou `fermeture`
- Règle : si Claude ne trouve pas un champ dans le texte, il le laisse vide. On teste sur 10 annonces réelles avec le résultat attendu écrit à la main

### 2. File de vérification au registre `src/lib/donnees/verification-registre.ts`
- Table `verifications_registre` (migration) : `entreprise_id`, `pays`, `priorite`, `statut` (`a_faire`, `trouvee`, `introuvable`), `numero_trouve`, `preuve_url`, `verifie_par`, `verifie_le`
- On y met en priorité les entreprises que des clients ciblent (module 08) et qui n'ont pas de numéro RCCM
- Server Actions admin : `prochaineVerification()`, `enregistrerVerification({ id, resultat, numero, preuve })`. Un humain de l'équipe (ou un ambassadeur) cherche sur le portail RCCM ou le guichet unique et saisit le résultat
- Résultat `trouvee` → `statut_verification = 'verifie_registre'`
- Connecteurs `rccm_ohada.ts`, `apiex_bj.ts`, `cepici_ci.ts`, `apix_sn.ts`, `cac_ng.ts`, `orc_gh.ts` : **squelettes seulement** (fonction qui renvoie « non disponible »), à compléter quand une convention ou une API officielle sera obtenue. Ne pas automatiser la recherche sur ces portails sans cela

### 3. OpenCorporates `src/lib/donnees/connecteurs/opencorporates.ts`
- Recherche par nom et pays, récupération de l'identifiant, du statut et du lien vers le registre
- **Désactivé** jusqu'à l'achat d'une licence commerciale (source 🟡)

### 4. Identifiants trouvés ailleurs
- Lors de la lecture d'un site (module 07F) ou d'un document, `extraireIdentifiants` repère un RCCM ou un identifiant fiscal affiché → provenance `sites_entreprises`, statut `verifie_site` si le format est valide

## Tests
- Le format de RCCM et d'identifiant fiscal est validé pour le Bénin, le Sénégal et la Côte d'Ivoire (exemples réels publics dans les fixtures)
- Une annonce de dissolution passe l'entreprise en `radiee` et crée un signal `fermeture`
- Un dirigeant est enregistré avec sa base légale, sans aucune autre donnée personnelle
- Un PDF scanné est marqué en erreur, sans plantage

## Critères d'acceptation
- [ ] 1 journal officiel réel traité de bout en bout
- [ ] La file de vérification fonctionne pour un admin
