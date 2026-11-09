# Module 07G : vague 6, nos sources propres et les particuliers

## Objectif
Construire ce qui n'appartiendra qu'à Djeli : l'annuaire gratuit où les entreprises s'inscrivent, les imports des clients, les vérifications des ambassadeurs, les partenaires. Et pour les particuliers : une base de **personnes qui ont donné leur accord**, de **créateurs**, de **communautés** et de **statistiques de zones**, jamais une liste de personnes récupérées sans accord.

## Prérequis
Modules 07A et 07B terminés. Module 04 (comptes) terminé.

## À faire

### 1. Annuaire gratuit « Inscrivez votre entreprise » (backend ; les pages viendront plus tard)
- Server Action publique `inscrireEntreprise({ nom, secteur, ville, pays, telephone, whatsapp, email, site, besoin, visibleAnnuaire, accepteContactClients })`
- Vérification du téléphone par un code à usage unique (envoi par le canal SMS ou WhatsApp du module 10 ; en attendant : mode simulation qui affiche le code dans le journal) ou de l'email par lien
- Rapprochement avec une fiche existante → la fiche est **revendiquée** : ses valeurs deviennent `verifie_proprietaire`
- Consentements enregistrés dans `consentements`, avec la version du formulaire
- Lien magique de gestion (`jeton_gestion`) : modifier la fiche, retirer l'accord, supprimer la fiche
- Signal `inscrite_annuaire`
- Anti-abus : 3 inscriptions par téléphone, 10 par IP et par jour

### 2. Imports des clients
- Server Actions (membre de l'entreprise cliente) : `importerFichier(fichier)` (CSV, Excel ; 20 000 lignes maximum), `proposerCorrespondanceColonnes` (Claude propose : colonne → champ), `validerImport`
- Normalisation (module 07B), dédoublonnage **dans l'espace du client**, retrait des contacts présents dans `opt_outs` (signalés au client)
- Rapprochement en **lecture seule** avec l'annuaire, pour enrichir la ligne du client (catégorie, site, signaux)
- **Jamais** d'écriture dans l'annuaire partagé à partir d'un import client

### 3. Ambassadeurs terrain
- Server Actions admin : `creerMission({ ambassadeurId, ville, quartier, fiches })` (fiches choisies : lieux sans téléphone, non vérifiés, ou ciblés par des clients)
- Server Actions ambassadeur : `mesMissions()`, `enregistrerVisite({ ficheId, resultat, telephone, photo, accordContact, position })`
- Photo dans un bucket privé `photos-terrain`, sans visage de personne (consigne écrite dans l'interface plus tard)
- Contrôle qualité : 10 % des visites tirées au hasard sont revérifiées par un autre ambassadeur ou par téléphone ; `taux_qualite` de l'ambassadeur mis à jour
- Visite validée → `verifie_terrain`

### 4. Partenaires
- Import d'un fichier partenaire seulement si `partenaires.accord_reference` est renseigné ; `partage_autorise` décide si ces données peuvent servir aux campagnes des clients

### 5. Particuliers (B2C)
- Server Action publique `inscriptionParticulier({ prenom, telephone, whatsapp, email, ville, activite, besoin, finalites })` avec cases de consentement **non cochées par défaut**, une par finalité
- Parrainage : `inviterFilleul({ telephone })` envoie **une seule** invitation ; le filleul n'est enregistré dans `particuliers` que s'il accepte ; sinon le numéro est effacé sous 30 jours
- Retrait de consentement : un lien dans chaque message, et le mot STOP → `retire_le` + `opt_outs`
- Le module 08 ne peut cibler un particulier que si un consentement `prospection_par_clients_djeli` est actif, **ou** s'il vient de l'import du client lui-même

### 6. Créateurs et communautés (pour comprendre les marchés, pas pour démarcher)
- `profils_createurs` : chaînes YouTube publiques trouvées par l'API officielle (recherche par mots-clés et pays), avec niche et abonnés ; données expirées après 30 jours. Aucune coordonnée personnelle stockée, sauf si la personne s'inscrit elle-même
- `communautes` : saisie par l'équipe ou import de documents (nom, sujet, ville, taille, lien), jamais la liste des membres

### 7. Statistiques de zones
- `banque_mondiale_wdi.ts` (mensuel) : population, population urbaine, utilisateurs d'Internet, abonnements mobiles, par pays
- Instituts nationaux et régulateurs télécoms : outil d'import de documents (module 07E)
- Fonction `tailleDuMarche({ categorie, ville })` : nombre de fiches dans l'annuaire + population de la ville, pour l'estimation montrée au client

## Tests
- Une inscription d'entreprise revendique la bonne fiche existante et ses valeurs deviennent prioritaires
- Un import client n'apparaît jamais dans `annuaire_entreprises` (test sur le nombre de lignes avant et après)
- Un particulier sans consentement de prospection n'est jamais renvoyé par la recherche du module 08
- Un filleul qui ne répond pas est effacé après 30 jours
- Un ambassadeur ne voit pas les missions d'un autre

## Critères d'acceptation
- [ ] Parcours complet d'inscription d'entreprise en local, avec code de vérification simulé
- [ ] Import d'un fichier client de 1 000 lignes en moins d'une minute
