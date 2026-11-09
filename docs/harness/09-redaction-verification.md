# Module 09 : rédaction des messages et vérification avant envoi

## Objectif
Écrire un message personnel pour chaque prospect et chaque étape, adapté au canal, puis le faire **relire par une seconde IA** qui bloque tout ce qui est interdit.

## Prérequis
Module 08 terminé.

## Règles d'écriture (source : `docs/SQUELETTE.md`, étapes « règles d'écriture »)
- Signé au nom du client : `entreprises.nom_signature`
- Dans la langue du prospect (`prospects.langue`), français par défaut
- **WhatsApp** : 2 à 4 phrases, pas de lien au premier message, une seule question à la fin
- **SMS** : 160 caractères maximum, mention « STOP au … »
- **Email** : objet court sans « RE: » ni majuscules, 60 à 120 mots, **ni lien ni pièce jointe au premier email**, pied de page avec l'adresse de désinscription
- Une **accroche précise** tirée de l'analyse du prospect, sinon on ne l'envoie pas
- Les relances apportent quelque chose de nouveau ; la dernière (J10) est un message de clôture poli

## À faire

### 1. Prompts `src/lib/ia/prompts/`
- `redaction.ts` : entrée = analyse du client + profil cible + analyse du prospect + étape de la séquence + canal + messages précédents ; sortie JSON `{ sujet?, corps, accroche_utilisee, langue }`
- `verification.ts` : la seconde IA reçoit le message + le contenu complet de `docs/INTERDITS.md` (sections 1 et 2) + les faits connus ; sortie `{ valide: boolean, problemes: [{ regle, extrait }], version_corrigee? }`

### 2. Vérifications par code (avant même l'IA) `src/lib/redaction/controles.ts`
- Longueur maximale par canal
- Aucun lien ni pièce jointe dans un premier message
- Aucun « RE: », « TR: », « Fwd: » dans l'objet
- Aucun prix, pourcentage ou chiffre qui n'apparaît pas dans l'analyse du client (comparaison simple des nombres)
- Le nom du prospect, s'il est utilisé, correspond à `nom_contact` ; sinon formule neutre « Bonjour, »
- Mots interdits (liste dans `src/lib/redaction/mots-interdits.ts` : « dernière chance », « garanti », « suite à notre échange »…)

### 3. Flux `src/lib/redaction/rediger.ts`
1. Rédaction (`claude-sonnet-5-5`)
2. Contrôles par code ; si échec, réécriture avec la liste des problèmes (2 tentatives maximum)
3. Vérification IA (`claude-haiku-5-5`) ; si non valide et `version_corrigee` fournie : repasser les contrôles par code sur la version corrigée
4. Toujours non valide → message en statut `bloque`, prospect signalé dans le journal, **aucun envoi**
- Le message validé est enregistré dans `messages` en statut `planifie`

### 4. Style validé une seule fois
- Pour une nouvelle campagne, si `entreprises.style_valide = false` : générer 3 exemples (WhatsApp, email, SMS) et les montrer au client (Server Action `exemplesDeStyle()`), qui valide ou demande des changements (`ajusterStyle({ remarques })`, stockées dans `entreprises.analyse.style`)
- Une fois validé : envoi autonome, sans validation message par message

## Tests (avec un faux client IA, pas d'appel réel)
- Un message avec un lien au premier contact est refusé par le code
- Un message contenant « Suite à notre échange » est refusé
- Un prix inventé est refusé
- Après 2 échecs, le message est `bloque` et rien n'est envoyé

## Critères d'acceptation
- [ ] 20 messages réels générés pour des prospects de test : tous passent la vérification ou sont bloqués avec une raison claire
- [ ] Chaque message enregistre la version des prompts utilisés
