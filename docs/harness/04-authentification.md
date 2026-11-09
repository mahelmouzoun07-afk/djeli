# Module 04 : authentification et création de l'entreprise

## Objectif
Inscription, connexion et rattachement de l'utilisateur à son entreprise, en reprenant l'analyse faite **avant** l'inscription (le visiteur colle son site sur la page d'accueil, voit l'aperçu, puis s'inscrit).

## Prérequis
Modules 01 à 03 terminés.

## Parcours (source : `docs/SQUELETTE.md`)
1. Le visiteur colle son site ou décrit son activité → analyse gratuite (module 06), stockée comme **analyse anonyme** avec un identifiant
2. Il voit l'aperçu, clique « Continuer » → inscription
3. À l'inscription, l'analyse anonyme est rattachée à sa nouvelle entreprise
4. Il achète des crédits (module 05) → accès au tableau de bord

## À faire

### 1. Migration
- Table `analyses_anonymes` : `jeton` texte unique (aléatoire, 32 octets), `entree` (lien ou description), `resultat` jsonb, `expire_le` (+7 jours), `rattachee_a` (entreprise_id nullable). Aucun accès client (service uniquement)
- Fonction `creer_entreprise_pour_utilisateur(nom text, pays text, jeton_analyse text)` (`security definer`) : crée l'entreprise, le membre `proprietaire`, la ligne `soldes_credits` à 0, et rattache l'analyse si le jeton est valide et non expiré

### 2. Méthodes de connexion (configurées dans Supabase Auth)
- Email + mot de passe (8 caractères minimum)
- Lien magique par email
- Google
- Emails d'authentification en français (modèles dans `supabase/templates/`), envoyés via SMTP Resend

### 3. Server Actions `src/app/(auth)/actions.ts`
- `inscription({ email, motDePasse, nomComplet, nomEntreprise, pays, telephone, jetonAnalyse? })`
- `connexion({ email, motDePasse })`
- `envoyerLienMagique({ email })`
- `deconnexion()`
- `motDePasseOublie({ email })` et `changerMotDePasse({ nouveau })`
- Route `src/app/auth/callback/route.ts` : échange le code (Google, lien magique), puis crée l'entreprise si c'est la première connexion
- Validation zod, messages d'erreur en français et sans révéler si un email existe déjà (« Si ce compte existe, un email a été envoyé »)
- Téléphone normalisé en E.164 (`libphonenumber-js`), pays parmi l'Afrique de l'Ouest + diaspora

### 4. Garde d'accès
- `src/lib/auth/session.ts` : `exigerUtilisateur()` et `exigerEntreprise()` pour les Server Components et Actions ; renvoient l'utilisateur et son `entreprise_id`, sinon redirection
- Règle : sans premier achat de crédits, l'utilisateur est redirigé vers `/credits` (sauf `/parametres`)

### 5. Limite de fréquence
- 5 tentatives de connexion par email et par 15 minutes, 3 inscriptions par IP et par heure (table `tentatives` ou Upstash si tu le justifies)

## Tests
- Inscription avec un jeton valide : l'analyse est rattachée
- Jeton expiré ou déjà utilisé : l'inscription réussit, sans rattachement
- Deux utilisateurs différents n'ont jamais accès à la même entreprise par erreur

## Critères d'acceptation
- [ ] Les trois méthodes de connexion fonctionnent en local
- [ ] Un utilisateur sans achat est redirigé vers `/credits`
- [ ] Aucun message d'erreur ne révèle si un email est inscrit
