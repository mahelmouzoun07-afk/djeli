# Module 05 : paiements Mobile Money

## Objectif
Acheter des packs de crédits par Mobile Money (MTN MoMo, Moov, Wave, Celtiis, Orange). Pas de carte bancaire.

## Prérequis
Modules 01 à 04 terminés.

## Prestataire
Le prestataire final n'est pas encore choisi (SaaSPay à confirmer, FedaPay en repli). **Code une interface** et implémente d'abord **FedaPay** (documentation : https://docs.fedapay.com), en mode **sandbox** uniquement.

## À faire

### 1. Interface `src/lib/paiements/prestataire.ts`
```ts
interface PrestatairePaiement {
  nom: string;
  creerPaiement(p: { paiementId: string; montantFcfa: number; telephone: string; operateur: Operateur; pays: string; description: string; urlRetour: string }): Promise<Resultat<{ referenceExterne: string; urlPaiement?: string }>>;
  verifierWebhook(requete: Request): Promise<Resultat<EvenementPaiement>>; // vérifie la signature
  lireStatut(referenceExterne: string): Promise<Resultat<StatutPaiement>>;
}
```
- `src/lib/paiements/fedapay.ts` : implémentation
- `src/lib/paiements/index.ts` : choisit le prestataire selon `PAIEMENT_PRESTATAIRE`

### 2. Server Action `acheterPack({ prix, telephone, operateur })`
- Le prix doit correspondre exactement à un pack de `src/lib/constants.ts` (jamais un montant envoyé librement par le navigateur)
- Crée la ligne `paiements` en `en_attente`, puis appelle le prestataire
- Renvoie l'URL de paiement ou l'instruction « Validez sur votre téléphone »

### 3. Webhook `src/app/api/webhooks/paiements/[prestataire]/route.ts`
- Vérifie la signature (rejet 401 sinon)
- **Revérifie le statut auprès du prestataire** avec `lireStatut` (on ne fait jamais confiance au seul contenu du webhook)
- Vérifie que le montant reçu = le montant attendu
- Si réussi : `crediter()` (module 03) avec `cle_idempotence = 'paiement:' + reference_externe` ; ajoute le bonus du pack ; si c'est le premier achat, ajoute le bonus de premier achat (valeur dans `constants.ts`, mettre `0` tant que non validé)
- Répond 200 rapidement ; un webhook rejoué ne crédite jamais deux fois

### 4. Rattrapage
- Tâche planifiée (module 11) toutes les 10 minutes : relit le statut des paiements `en_attente` de plus de 5 minutes ; abandonne après 24 h (`echoue`)

### 5. Reçu
- Après un paiement réussi : événement `paiement_reussi` (email et WhatsApp envoyés au module 13)

## Variables d'environnement
`PAIEMENT_PRESTATAIRE`, `FEDAPAY_SECRET_KEY`, `FEDAPAY_WEBHOOK_SECRET`, `FEDAPAY_ENV` (`sandbox` ou `live`)

## Tests
- Webhook avec une mauvaise signature → 401, aucun crédit
- Même webhook reçu 3 fois → crédité une seule fois
- Montant reçu différent du montant attendu → aucun crédit, événement d'alerte
- Prix qui ne correspond à aucun pack → refusé

## Critères d'acceptation
- [ ] Un achat complet en sandbox crédite le bon nombre de crédits (bonus compris)
- [ ] Aucune clé secrète dans le code ni dans les logs
