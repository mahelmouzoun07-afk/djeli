# Module 15 : sécurité, contrôles finaux et mise en production

## Objectif
Vérifier tout le backend avant le lancement : sécurité, coûts, scénarios complets, sauvegardes. **Pas de nouvelle fonctionnalité** dans ce module.

## Prérequis
Modules 01 à 14 terminés.

## À faire

### 1. Audit de sécurité (rapport `docs/audit-securite.md`)
- RLS : liste de chaque table, ses politiques, et un test qui prouve l'isolation entre deux clients
- Toutes les routes `api/webhooks/*` vérifient une signature
- Aucune clé secrète dans le code, l'historique git ou les journaux (`git log -p | grep -i "sk_\|secret\|token"`)
- `npm audit` : aucune faille haute ou critique
- En-têtes de sécurité dans `next.config.ts` : CSP, HSTS, `X-Frame-Options`, `Referrer-Policy`
- Limites de fréquence sur : analyse gratuite, connexion, inscription, achat, webhooks
- Protection SSRF du lecteur de sites testée

### 2. Les 10 scénarios de bout en bout (source : `docs/SQUELETTE.md`, tests avant lancement)
Écrire chaque scénario comme un test automatisé (Vitest + base locale + faux fournisseurs) :
1. Visiteur → analyse d'un site → aperçu → inscription → achat → campagne lancée
2. Description sans site → questions → profils → campagne
3. Prospect qui répond « intéressé » → réponse auto → rendez-vous dans l'agenda → alertes
4. Prospect qui répond STOP → plus jamais contacté, même par un autre client
5. Solde qui tombe à 0 en pleine campagne → pause des nouveaux contacts, l'agent répond toujours
6. Plafond du jour atteint → reprise le lendemain
7. Paiement : webhook rejoué 3 fois → crédité une fois
8. Message bloqué par la vérification → jamais envoyé, crédits non débités
9. Note vocale incompréhensible → transmise au client
10. Boîte email signalée → mise en pause, les envois passent sur les autres boîtes

### 3. Coûts
- Tableau de bord SQL (vue `couts_par_jour`) : coût IA, coût d'envoi, crédits consommés, par client et par jour
- Alerte à l'équipe si le coût réel d'un client dépasse 70 % de ce qu'il a payé

### 4. Production
- Projet Supabase de production séparé, sauvegardes quotidiennes activées
- Variables d'environnement de production documentées dans `docs/production.md` (sans valeurs)
- Trigger.dev en environnement `prod`
- Procédure de retour arrière : comment revenir à la version précédente du site et de la base

## Critères d'acceptation
- [ ] Les 10 scénarios passent
- [ ] Rapport d'audit sans point bloquant
- [ ] `docs/production.md` permet à quelqu'un d'autre de déployer
