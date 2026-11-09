# Module 10 : envoi des messages (email, SMS, WhatsApp)

## Objectif
Envoyer les messages depuis **les comptes de Djeli** (jamais ceux du client), derrière une interface commune, avec toutes les protections : désinscriptions, horaires, quotas, crédits.

## Prérequis
Modules 03 et 09 terminés.

## À faire

### 1. Interface commune `src/lib/envoi/canal.ts`
```ts
interface CanalEnvoi {
  canal: Canal;
  envoyer(m: MessageAEnvoyer): Promise<Resultat<{ idExterne: string; expediteurId: string }>>;
  traiterStatut(requete: Request): Promise<Resultat<MiseAJourStatut[]>>; // webhooks livré/lu/échoué
}
```
Chaque canal est un fichier séparé. Ajouter un canal ne doit demander aucune modification ailleurs que dans `src/lib/envoi/index.ts`.

### 2. Garde commune `src/lib/envoi/garde.ts` (appelée avant **tout** envoi, quel que soit le canal)
Dans cet ordre, et chaque refus est journalisé avec sa raison :
1. Destinataire dans `opt_outs` → refus définitif, prospect `desinscrit`
2. Premier message et `contacts_recents` < 7 jours → reporté
3. Hors des horaires 8 h – 19 h **heure du prospect**, ou vendredi 12 h 30 – 14 h 30 dans les pays à majorité musulmane (liste dans `regles-pays.ts`), ou jour férié (`jours_feries`) → reporté au prochain créneau autorisé
4. Pays interdit pour ce canal → refus
5. Débit des crédits (`debiter()`, clé `envoi:` + message_id). Refus → campagne en pause
6. Ensuite seulement : envoi. Si l'envoi échoue → `rembourser()`

### 3. Email `src/lib/envoi/email.ts`
- Envoi par **SMTP** depuis les boîtes de `boites_envoi` (`nodemailer`). Les identifiants sont lus depuis un coffre de secrets par `identifiants_ref` (variables d'environnement `BOITE_<ID>_MOTDEPASSE` au début)
- Choix de la boîte : en bonne santé, pas en pause, sous son quota du jour, la moins utilisée aujourd'hui
- Une même conversation garde toujours la même boîte
- En-têtes : `List-Unsubscribe` et `List-Unsubscribe-Post` (désinscription en un clic), `Reply-To` vers la boîte
- Lien de désinscription : `APP_URL/desinscription/[jeton]` (page simple + route qui ajoute à `opt_outs`)
- Lecture des réponses par **IMAP** : tâche toutes les 2 minutes (`imapflow`), messages transmis au module 12 ; détection des rebonds (adresse invalide → `injoignable`) et des plaintes (→ boîte en pause + `opt_outs`)
- Santé de la boîte : baisse à chaque rebond ou plainte ; pause automatique sous un seuil
- Resend reste réservé aux emails transactionnels (module 13)

### 4. SMS `src/lib/envoi/sms.ts`
- Interface prête pour un agrégateur (choix à venir) ; implémentation de départ : **mode simulation** qui écrit dans le journal sans envoyer
- Texte terminé par la mention STOP ; réception du mot STOP → `opt_outs`

### 5. WhatsApp `src/lib/envoi/whatsapp.ts`
- Implémentation : **WhatsApp Business Cloud API officielle de Meta** (Graph API), un numéro Djeli par pays (`numeros_djeli`)
- Premier message hors fenêtre de 24 h : **modèle validé par Meta** (nom du modèle + variables) ; dans la fenêtre de 24 h après un message du prospect : texte libre
- Webhook `src/app/api/webhooks/whatsapp/route.ts` : vérification du jeton (GET) et de la signature `X-Hub-Signature-256` (POST) ; statuts (envoyé, livré, lu, échoué) et messages entrants (module 12)
- Suivre la `note_qualite` de chaque numéro (webhook de qualité) : si elle baisse, réduire le volume ; si elle devient basse, **pause** du numéro et alerte à l'équipe
- Respecter les limites d'envoi du numéro (`limite_jour`)
- Mot STOP, « arrêtez », blocage ou signalement → `opt_outs`

### 6. Statuts
- Route webhook par canal, mise à jour de `messages.statut` ; statut `echoue` ou `bloque` → `rembourser()`

## Variables d'environnement
`WHATSAPP_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `SMS_PRESTATAIRE`, `BOITE_<ID>_MOTDEPASSE`

## Tests
- La garde refuse un destinataire en `opt_outs`, même pour un autre client
- Un message prévu à 21 h heure de Dakar est reporté au lendemain 8 h
- Un envoi qui échoue rembourse les crédits une seule fois
- Une boîte au quota n'est plus choisie
- Signature WhatsApp invalide → 401

## Critères d'acceptation
- [ ] Email envoyé et réponse lue en boucle sur deux boîtes de test à nous
- [ ] Message WhatsApp de modèle envoyé vers un numéro de test à nous (sandbox Meta)
- [ ] Aucun envoi possible sans passer par `garde.ts` (vérifie par une recherche dans le code)
