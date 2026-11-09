# Djeli : le squelette, étape par étape

*Mise à jour du 9 novembre 2026. Tout est construit dès le lancement : il n'y a plus de « version 1 » ni de « plus tard ».*

Ce document décrit **tout ce qui se passe**, dans l'ordre, sans code. Les points marqués **[À valider]** attendent ta décision.

Vocabulaire :
- **Client** : l'entreprise ou la personne qui paie Djeli (ex. un graphiste à Cotonou)
- **Prospect** : l'entreprise ou le particulier que l'agent contacte pour le client
- **Agent** : l'IA de Djeli qui travaille pour le client
- **Agent support** : l'IA du support, sur le numéro général de Djeli, 24 h/24

Fil rouge : **Koffi Adjovi, graphiste débutant à Cotonou (Studio Koffi)**.

---

## Vue d'ensemble

| # | Étape | Qui | Quand |
|---|---|---|---|
| 0 | Préparer la machine Djeli | Équipe Djeli | Avant l'ouverture, puis en continu |
| 1 | Le visiteur arrive | Visiteur | — |
| 2 | Il décrit son activité (lien ou formulaire) | Visiteur | Minute 0 |
| 3 | L'agent analyse l'activité | Agent | Minutes 0 à 2 |
| 4 | Questions complémentaires | Agent → visiteur | Si nécessaire |
| 5 | Les profils de clients idéaux | Agent → visiteur | Minute 3 |
| 6 | L'aperçu | Agent | Minute 4 |
| 7 | Inscription | Visiteur | Minute 5 |
| 8 | Achat de crédits | Client | Minute 6 |
| 9 | Mise en route | Client + agent | Jour 0 |
| 10 | Recherche des prospects | Agent | Chaque jour |
| 11 | Analyse de chaque prospect | Agent | Chaque jour |
| 12 | Choix du canal | Agent | Pour chaque prospect |
| 13 | La séquence de prospection | Agent | Jours 1 à 10 |
| 14 | Les appels WhatsApp | Agent | Sur déclencheur |
| 15 | Les réponses des prospects | Agent (+ client si besoin) | Dès qu'une réponse arrive |
| 16 | Les rendez-vous | Agent + client | Dès qu'un prospect est intéressé |
| 17 | Le client pilote depuis WhatsApp | Client ↔ agent | Tous les jours |
| 18 | Le tableau de bord web | Client | Quand il veut |
| 19 | Les tests et l'apprentissage | Agent + Djeli | En continu |
| 20 | Qualité et protection | Djeli | En continu |
| 21 | Solde de crédits et recharge | Client | Quand le solde baisse |
| 22 | Support | Agent support | 24 h/24 |
| 23 | Tests du produit avant ouverture | Équipe Djeli | Avant l'ouverture |

---

## Étape 0 — Préparer la machine Djeli

**Comptes et démarches (certaines prennent des semaines, à lancer en premier)**
- Domaine principal `djeliai.com`
- **10 boîtes email** de prospection sur 3 ou 4 domaines d'envoi séparés, **préchauffées** pendant 2 à 3 semaines
- Compte **Meta Business** vérifié
- **Un numéro WhatsApp Djeli par pays** pour la prospection, sur l'API officielle (WhatsApp Cloud API)
- **Un numéro WhatsApp général** pour le support et pour parler aux clients
- **Modèles de messages WhatsApp** soumis à Meta et validés (voir étape 13)
- Prestataire Mobile Money (SaaSPay, à confirmer)
- Compte ElevenLabs (voix des appels)
- Numéro SMS et nom d'expéditeur déclaré dans chaque pays
- Pages légales

**L'annuaire**
- Chargement initial : Overture + Foursquare pour toute l'Afrique de l'Ouest
- Nettoyage : suppression des doublons, classement par secteur et par ville
- **Entreprises et particuliers** : la base doit aussi permettre de cibler des particuliers (voir étape 10)
- Enrichissement à la demande : l'analyse détaillée d'une entreprise n'est faite que lorsqu'un client vise son secteur
- Ajout des autres sources, une par une, en continu

---

## Étape 1 — Le visiteur arrive

**D'où il vient** : publicités, bouche-à-oreille, parrainage, campagnes de Djeli pour lui-même, réseaux sociaux, annuaire gratuit.

L'accroche sera choisie en même temps que la méthode de prospection.

---

## Étape 2 — Il décrit son activité

Deux portes d'entrée (**plus de note vocale**) :

| Porte | Ce que fait le visiteur |
|---|---|
| **Lien** | Colle l'adresse de son site |
| **Formulaire** | Répond à quelques questions et coche des cases |

**Le formulaire**
- Ce que vous vendez
- Votre client idéal
- Secteurs visés (cases à cocher)
- Vous vendez à des entreprises, à des particuliers, ou aux deux
- Taille des entreprises visées
- Pays et villes
- Votre prix moyen (fourchettes en FCFA)
- Votre objectif (rendez-vous, devis, appel, visite, commande)

---

## Étape 3 — L'agent analyse l'activité

**Durée visée** : moins de 2 minutes, avec une animation qui montre ce que fait l'agent.

**Ce qu'il lit** : le site (plusieurs pages), les réseaux sociaux liés, quelques concurrents ; ou les réponses du formulaire.

**Ce qu'il produit : la fiche de l'activité** : offres et prix, points forts et preuves, zone, concurrents, ce qui manque.

---

## Étape 4 — Questions complémentaires

Avec un lien, **aucune question si le site suffit**.

**Informations indispensables** : ce qu'il vend, à qui (entreprises, particuliers, quel type), où, ce qu'il veut obtenir.

**Comment** : 1 à 3 questions maximum, avec des cases à cocher ou des boutons.

---

## Étape 5 — Les profils de clients idéaux

L'agent propose **3 à 5 profils**, avec une note et une explication. Le visiteur peut décocher, modifier ou ajouter.

Exemple pour Koffi :
| Profil | Pourquoi | Note |
|---|---|---|
| Restaurants et maquis de Cotonou sans logo professionnel | Beaucoup de demande, petits budgets compatibles | 92 |
| Boutiques de mode qui vendent sur Instagram | Besoin de visuels réguliers | 85 |
| Écoles privées avant la rentrée | Affiches et flyers chaque année | 78 |
| Entreprises qui viennent d'être créées | Ont besoin d'une identité visuelle | 74 |

---

## Étape 6 — L'aperçu

L'agent affiche **le vrai nombre** de prospects trouvés et **la liste**, mais **sans les noms, les logos ni les coordonnées**.

Ce qui reste visible pour chaque ligne : secteur, ville, taille, et la raison pour laquelle c'est un bon prospect (« pas de logo sur sa page Facebook », « vient d'ouvrir »).

Message : « Djeli a trouvé 1 240 prospects pour vous. Créez votre compte pour qu'il commence à leur écrire. »

---

## Étape 7 — Inscription

**Ce qu'on demande** : nom et prénom, nom de l'entreprise (ils apparaissent dans les messages), email et mot de passe ou connexion Google, numéro WhatsApp vérifié par un code, pays.

L'analyse, les profils et l'aperçu sont gardés.

---

## Étape 8 — Achat de crédits

Le client achète des crédits en Mobile Money (MTN MoMo, Moov, Wave, Celtiis, Orange…). Détail du modèle à crédits : voir `MODELE-ECONOMIQUE.md`.

**Avant de payer**, Djeli lui montre une estimation : « Avec 10 000 FCFA, l'agent peut contacter environ 60 prospects sur WhatsApp. »

**Si le paiement échoue** : message clair, nouvel essai, rappel WhatsApp une heure plus tard.

---

## Étape 9 — Mise en route

**Ce que le client règle** (5 minutes, tout est prérempli) :
- Nom affiché dans les messages : « Koffi Adjovi — Studio Koffi »
- Horaires où il est joignable
- Connexion de son Google Agenda
- Ce que l'agent peut dire (prix, délais, offres) et ce qu'il ne doit jamais dire
- Entreprises à ne jamais contacter (ses clients actuels, ses concurrents)
- **Gestion des crédits** : mode automatique (l'agent répartit les crédits entre les canaux selon ce qui marche) ou mode manuel (le client fixe une part pour chaque canal), plafond de dépense par jour
- Facultatif : importer sa propre liste de contacts

**Validation du style, une seule fois** : l'agent montre 3 exemples de messages. Le client choisit le ton et valide. Ensuite, l'agent envoie tout seul, **sans validation**.

**Ce qu'on annonce au client** : « Les premiers messages partent aujourd'hui. Les premières réponses arrivent en général dans les 48 heures sur WhatsApp. »

---

## Étape 10 — Recherche des prospects

**Chaque jour**, l'agent sélectionne les prospects du jour, selon les profils et selon le budget de crédits.

**Entreprises** : annuaire, note d'adéquation, les meilleurs d'abord.

**Particuliers** : un particulier n'est pas une fiche d'annuaire. On les atteint par :
- les listes que le client importe (ses anciens clients, ses contacts) ;
- les personnes qui écrivent en premier, grâce aux publicités « Cliquer pour discuter sur WhatsApp » ;
- l'annuaire gratuit et les formulaires de Djeli, où les gens acceptent d'être contactés.

**L'agent retire automatiquement** :
- les désinscrits (liste commune à tous les clients) ;
- les exclusions du client ;
- les prospects déjà contactés par ce client.

**Pas de partage entre clients** : deux clients du même métier peuvent contacter le même prospect.

**Protection des numéros Djeli** (à ne pas confondre avec le partage) : un même prospect ne reçoit **pas plus d'un premier message Djeli par semaine**, tous clients confondus. Les autres messages attendent leur tour. Sans ça, un restaurant contacté par cinq graphistes le même jour bloquera le numéro Djeli, et ce blocage touchera tous les clients du pays.

- **[À valider 1]** Cette limite d'un premier message par semaine et par prospect ?

---

## Étape 11 — Analyse de chaque prospect

**Ce que l'agent lit** : site, pages Facebook et Instagram publiques, avis, offres d'emploi, publicités, actualités, registre ; Google Maps si les autres sources ne suffisent pas.

**Ce qu'il produit : la fiche prospect**
- Ce que fait le prospect
- **Le signal** : la raison précise de lui écrire maintenant
- Le décideur probable et son nom s'il est public
- Coordonnées : WhatsApp, téléphone, email (vérifié)
- **Le type** : grande entreprise, PME, indépendant, particulier
- La langue

---

## Étape 12 — Choix du canal

**La règle de base (ta décision)**

| Type de prospect | Premier canal | Ensuite |
|---|---|---|
| **Grande entreprise** (structurée, email professionnel, lit ses emails) | Email | WhatsApp après 1 ou 2 jours sans réponse |
| **PME, indépendant, commerçant, particulier** | **WhatsApp directement** | Relances WhatsApp, puis appel WhatsApp si le prospect l'accepte |
| Pas de WhatsApp trouvé | Email ou SMS | — |

**Tout part des numéros de Djeli, sans validation du client.** Le prospect voit le numéro WhatsApp Djeli du pays ; le message dit qu'il vient de Koffi, du Studio Koffi.

### Ce que WhatsApp impose (règles officielles de Meta)

1. **Le premier message doit être un modèle validé par Meta.** On ne peut pas écrire un texte libre au premier contact. On prépare donc une bibliothèque de modèles (par métier et par type de prospect), avec des emplacements pour personnaliser : le nom du prospect, le signal, l'offre. Meta refuse les modèles composés presque uniquement d'emplacements, donc chaque modèle garde une vraie phrase fixe.
2. **Dès que le prospect répond**, l'agent peut écrire librement pendant 24 heures. Chaque nouvelle réponse du prospect relance ces 24 heures.
3. **Meta demande que la personne ait accepté de recevoir des messages** de l'entreprise. Écrire à des inconnus est contraire à ses règles : les blocages et signalements font baisser la note de qualité du numéro, puis Meta met en pause des modèles, limite le numéro ou le suspend. Meta peut aussi demander la preuve de l'accord.
4. **Meta limite les messages marketing qu'une même personne reçoit**, toutes entreprises confondues : certains messages peuvent ne pas être livrés.

**Ce qu'on met en place pour garder les numéros en vie**
- Uniquement l'**API officielle** : les outils non officiels qui pilotent WhatsApp Web font bannir les numéros encore plus vite, et ne permettent pas les appels
- Messages vraiment personnalisés, utiles, courts, avec une sortie claire (« Répondez STOP »)
- Volume qui monte progressivement sur chaque nouveau numéro
- Surveillance de la note de qualité de chaque numéro, plusieurs fois par jour
- Si la note baisse : envois ralentis, modèle en cause retiré
- **Plusieurs façons d'obtenir l'accord**, pour réduire le risque : publicités « Cliquer pour discuter », email ou SMS qui demande « Je peux vous écrire sur WhatsApp ? », annuaire gratuit, listes du client dont les contacts ont déjà accepté

**Particuliers** : écrire sans accord à un particulier par message électronique est interdit dans plusieurs pays (c'est le cas en France). Le texte du Code du numérique béninois reste à vérifier. Avant d'écrire à froid à des particuliers, l'agent juridique doit vérifier la loi de chaque pays.

- **[À valider 2]** Tu as bien noté ces règles de Meta et ce risque pour les numéros partagés entre tous les clients ?

---

## Étape 13 — La séquence de prospection

### Grandes entreprises
| Jour | Action |
|---|---|
| J1 | Email 1 : le signal + une question (mardi à jeudi, 8 h à 11 h, heure du prospect) |
| J2 ou J3 | Pas de réponse : **WhatsApp 1** (modèle validé), qui rappelle l'email |
| J5 | Pas de réponse : WhatsApp 2, relance avec de la valeur (une réalisation, un conseil) |
| J9 | Pas de réponse : dernier message, court et poli |
| J10 | Fin. Nouvelle tentative possible à J90, avec un autre angle, seulement si le prospect n'a pas dit non |

### PME, indépendants, commerçants, particuliers
| Jour | Action |
|---|---|
| J1 | **WhatsApp 1** (modèle validé) : le signal + une question |
| J3 | Pas de réponse : WhatsApp 2, avec de la valeur |
| J7 | Pas de réponse : dernier message |
| J10 | Fin, nouvelle tentative possible à J90 |

**La séquence s'arrête immédiatement si** le prospect répond, dit STOP, bloque le numéro ou signale le message, ou si le message n'est pas livré.

**Horaires** : 8 h à 19 h, heure du prospect, du lundi au samedi ; pas pendant la prière du vendredi dans les pays à majorité musulmane ; pas les jours fériés.

### Règles d'écriture
- Commencer par **le signal**, jamais par « Je me présente »
- Court (WhatsApp : 3 à 5 lignes)
- Un seul bénéfice concret
- Une seule question, facile à répondre
- Préciser au nom de qui on écrit : « Koffi, du Studio Koffi »
- Une sortie : « Répondez STOP pour ne plus recevoir de message »

**Exemple, WhatsApp 1 de Koffi** :
> Bonjour Madame Houngbo, ici Koffi du Studio Koffi, graphiste à Cotonou.
> J'ai vu la carte du Maquis Chez Tanti sur Facebook : le logo est difficile à lire sur téléphone.
> Je vous prépare 3 idées de logo, sans engagement ?
> (Répondez STOP pour ne plus recevoir de message)

La méthode complète de prospection (accroches, modèles par métier) sera travaillée à part.

---

## Étape 14 — Les appels WhatsApp

**Les appels passent par WhatsApp, pas par les opérateurs.** Ils sont beaucoup moins chers qu'un appel classique (environ 0,61 à 0,73 $ la minute vers un mobile chez Twilio). Mais ils ne sont **pas illimités** : WhatsApp impose ses règles.

**Les règles de Meta pour les appels lancés par une entreprise**
1. **Le prospect doit d'abord accepter d'être appelé.** L'agent lui envoie une demande d'autorisation, dans une conversation déjà ouverte ou par un modèle validé.
2. Le prospect choisit : autorisation **pour 7 jours** ou **permanente**. Il peut la retirer quand il veut.
3. **Au maximum 1 demande d'autorisation par 24 heures, et 2 par 7 jours.**
4. Après **4 appels manqués ou refusés de suite**, l'autorisation est annulée automatiquement.
5. Les appels lancés par l'entreprise sont **facturés à la minute** par Meta (prix selon le pays). Les appels lancés par le prospect sont gratuits.

**Conséquence** : pas d'appel à froid. L'appel vient **après** un échange écrit.

**Quand l'agent appelle**
| Déclencheur | Ce qui se passe |
|---|---|
| Le prospect est intéressé mais pose beaucoup de questions | L'agent propose : « Je peux vous appeler 3 minutes sur WhatsApp ? » + demande d'autorisation |
| Le prospect demande à être appelé | Demande d'autorisation, puis appel au moment choisi |
| Confirmation d'un rendez-vous | Appel la veille, si l'autorisation est encore valable |
| Le prospect appelle lui-même le numéro Djeli | L'agent décroche (gratuit) |

**Déroulé de l'appel**
1. **Avant** : un modèle Claude puissant prépare la fiche d'appel (qui, besoin, accroche, objections, objectif)
2. **Pendant** : le modèle Claude le plus rapide converse, la voix ElevenLabs parle. **Première phrase : l'agent dit qu'il est l'assistant virtuel de Koffi, du Studio Koffi.** Il peut consulter l'agenda et réserver
3. **Après** : résumé, note d'intérêt, alerte au client

**Règles** : 2 à 4 minutes, objectif unique (rendez-vous ou accord), arrêt immédiat si la personne refuse, pas d'appels vers les États-Unis. Le nombre d'appels dépend des crédits du client.

---

## Étape 15 — Les réponses des prospects

**Toutes les réponses arrivent au même endroit**, quel que soit le canal.

| Type de réponse | Ce que fait l'agent | Le client est prévenu ? |
|---|---|---|
| **Intéressé** | Répond, propose des horaires de rendez-vous ou un appel | **Oui, tout de suite** : « Lead chaud » |
| **Question** que l'agent sait traiter | Répond | Dans le résumé du soir |
| **Question** que l'agent ne sait pas traiter | Demande au client sur WhatsApp, puis répond | Oui |
| **Pas maintenant** | Note la date, programme une relance | Dans le résumé |
| **Pas intéressé** | Remercie, arrête | Dans le résumé |
| **Mauvaise personne** | Demande qui serait la bonne personne | Dans le résumé |
| **STOP** | Arrête tout, ajoute à la liste commune | Non |
| **Absent** | Reprend après la date de retour | Non |
| **Hostile** | Arrête, n'envoie rien | Dans le résumé |
| **Note vocale** | La transcrit et répond. **S'il ne comprend pas** (langue locale, son mauvais), il envoie la note au client avec le contexte (qui, quelle conversation, ce qui a été dit avant), et le client lui dit quoi répondre | Oui, si l'agent ne comprend pas |

**Délai de réponse de l'agent** : 5 à 20 minutes pendant les heures de travail, le lendemain matin la nuit.

**Si le client ne répond pas à une question de l'agent** : après 4 heures, message d'attente au prospect et relance du client.

---

## Étape 16 — Les rendez-vous

- Google Agenda connecté : l'agent propose 2 ou 3 créneaux libres et réserve
- **En plus**, l'agent peut proposer des horaires que le client confirme sur WhatsApp (« Mme Houngbo propose jeudi 15 h. Je confirme ? Oui / Non »)
- Une fois confirmé : événement dans l'agenda (lien Google Meet si visio), confirmation au prospect, rappels la veille et 2 heures avant
- Après le rendez-vous, l'agent demande au client : « Le rendez-vous a eu lieu ? » puis « Résultat ? Signé / En discussion / Perdu »

---

## Étape 17 — Le client pilote depuis WhatsApp

Le client peut tout faire sans ouvrir le site, **par écrit uniquement** (pas de note vocale du client vers l'agent).

**Ce que l'agent envoie**
| Message | Quand |
|---|---|
| Lead chaud | Tout de suite |
| Question à trancher (Oui / Non) | Tout de suite |
| Note vocale d'un prospect que l'agent n'a pas comprise | Tout de suite |
| Rendez-vous confirmé | Tout de suite |
| Résumé du jour | Vers 19 h, s'il y a du nouveau |
| Bilan de la semaine | Lundi matin |
| Solde de crédits bas | Voir étape 21 |

**Ce que le client peut demander** : « Pause », « Reprends », « Où en est-on ? », « Montre-moi les leads chauds », « Ne contacte plus les écoles », « Ajoute Porto-Novo », « Mets plus de crédits sur WhatsApp », « Mon prix pour un logo, c'est 50 000 FCFA ».

L'agent confirme toujours ce qu'il a compris avant de changer un réglage.

---

## Étape 18 — Le tableau de bord web

- **Accueil** : solde de crédits, dépenses par canal, réponses, leads chauds, rendez-vous
- **Prospects** : liste, filtres, fiches, historique des échanges, export
- **Messagerie** : toutes les conversations, avec la possibilité de reprendre la main
- **Profils cibles** : modifier, ajouter, mettre en pause
- **Crédits** : solde, historique, répartition par canal (automatique ou manuelle), plafond par jour, recharge
- **Paramètres** : nom affiché, horaires, agenda, consignes, exclusions

---

## Étape 19 — Les tests et l'apprentissage

**Tests de messages** : deux versions du premier message, chacune envoyée à au moins 30 prospects ; on compare les **réponses positives** ; la meilleure est gardée, une nouvelle l'affronte. Mêmes tests pour l'heure, la longueur, la question finale, le canal.

**Apprentissage commun** : résultats enregistrés par secteur, pays, canal et type d'accroche. Un nouveau client profite de ce qui a marché pour les autres. Seules les statistiques sont partagées, jamais les messages d'un client.

**Bilan mensuel** envoyé au client.

---

## Étape 20 — Qualité et protection

**Numéros WhatsApp** : note de qualité suivie plusieurs fois par jour ; si elle baisse, envois ralentis et modèle en cause retiré.

**Boîtes email** : erreurs sous 3 %, signalements sous 0,1 % ; au-delà, boîte en pause.

**Clients** : un client dont les messages provoquent beaucoup de blocages est mis en pause et contacté.

**Contrôle avant envoi** : un second passage de l'IA vérifie chaque message selon la liste des interdits (voir `INTERDITS.md`).

**Prospects** : liste de désinscription commune et à vie, page publique « Pourquoi ai-je reçu ce message ? ».

---

## Étape 21 — Solde de crédits et recharge

| Moment | Action |
|---|---|
| Solde à 20 % | Alerte WhatsApp + email, avec le bilan (« 9 réponses, 2 rendez-vous ») et le lien de recharge |
| Solde à 5 % | Second rappel |
| Solde à 0 | Plus de nouveaux envois. **L'agent continue de répondre** aux prospects déjà en conversation, pour ne pas perdre un lead chaud (ces réponses sont gratuites) |
| Plafond par jour atteint | L'agent s'arrête jusqu'au lendemain, le client est prévenu |

**Données** : gardées tant que le compte existe. Le client peut tout supprimer quand il veut, et fixer ses propres limites de dépense.

---

## Étape 22 — Support

- **Un agent IA de support**, sur le numéro WhatsApp général de Djeli, **24 h/24**
- Il connaît le compte du client (solde, campagnes, paiements) et peut agir : relancer un paiement, mettre en pause, expliquer une dépense
- Ce qu'il ne règle pas seul (remboursement, litige, bug) est noté et remonté à toi

---

## Étape 23 — Tests du produit avant ouverture

Pas de bêta : on ouvre directement au public, après ces tests.

1. **Parcours complet** avec une entreprise fictive, par le lien et par le formulaire
2. **Paiement** : chaque moyen de paiement en mode test, puis un vrai petit paiement
3. **Emails** : vers nos propres adresses (Gmail, Outlook, Yahoo, adresses pro) pour vérifier qu'ils arrivent en boîte de réception
4. **WhatsApp** : chaque modèle, chaque message de l'étape 17 et chaque commande du client, vers nos propres numéros
5. **Réponses** : on joue les prospects et on envoie chaque type de réponse, y compris des notes vocales en français et en langue locale
6. **Appels WhatsApp** : demande d'autorisation, appel, refus, appel manqué, vers nos téléphones
7. **Rendez-vous** : réservation, rappels, annulation, avec un vrai Google Agenda
8. **Crédits** : achat, dépense par canal, solde bas, solde à zéro, plafond par jour
9. **Téléphone** : tout le parcours sur un petit Android avec une connexion lente
10. **Djeli prospecte pour Djeli** : premières vraies campagnes, vers des graphistes et des agences d'Afrique de l'Ouest

---

## Points à valider

1. Un seul premier message Djeli par semaine et par prospect, tous clients confondus (pour protéger les numéros)
2. Bien noter les règles de Meta (accord du destinataire, modèles validés) et le risque de suspension des numéros partagés
