# Auth Console — dashboard des tenants

Interface web de [auth-web-app-api](https://github.com/AdouaniHoussemKhalil/auth-web-app-api) : un tenant y crée son
compte, gère ses applications clientes et leurs identifiants.

React 19 + TypeScript + Vite + Tailwind CSS v4, avec la bibliothèque UI [QuickadUI](https://quickadui-docs-nu.vercel.app/)
(`@quickadui/*`).

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis adapter VITE_API_BASE_URL si besoin
npm run dev
```

L'API doit tourner (par défaut sur `http://localhost:8080`).

## Scripts

| Commande                          | Rôle                                                      |
| --------------------------------- | --------------------------------------------------------- |
| `npm run dev`                     | Serveur de développement                                  |
| `npm run build`                   | Vérification des types puis build de production (`dist/`) |
| `npm run typecheck`               | Vérification des types                                    |
| `npm run lint`                    | ESLint                                                    |
| `npm run format` / `format:check` | Prettier                                                  |
| `npm test`                        | Tests (Vitest + Testing Library)                          |

La CI GitHub Actions exécute audit, typecheck, lint, format, tests et build sur chaque PR vers `develop` et `master`.

**Hook pre-commit** (husky + lint-staged, installé par `npm install`) : à chaque `git commit`, les fichiers indexés
passent par `eslint --fix` puis Prettier (JSON, CSS, Markdown et YAML : Prettier seul) et sont réindexés. Si ESLint
trouve une erreur qu'il ne sait pas corriger, le commit est refusé avec le message : corriger puis recommiter. Les
modifications non indexées ne sont pas touchées. Configuration : clé `lint-staged` de `package.json`, `.husky/pre-commit`.

## Configuration

| Variable                | Défaut                  | Rôle                                                       |
| ----------------------- | ----------------------- | ---------------------------------------------------------- |
| `VITE_API_BASE_URL`     | `http://localhost:8080` | URL de l'API, sans slash final                             |
| `VITE_GOOGLE_CLIENT_ID` | —                       | Client ID OAuth Google : affiche « Continuer avec Google » |

Les variables sont lues uniquement dans `src/config/env.ts`.

**Connexion Google** : `VITE_GOOGLE_CLIENT_ID` doit être le même Client ID que `google.clientId` de l'API (sinon l'API
répond `invalidGoogleToken`). Dans Google Cloud Console, ce Client ID « Application Web » doit autoriser l'origine du
dashboard (`http://localhost:5173` en développement) dans « Origines JavaScript autorisées ».

## Déploiement (Render, site statique)

Le dashboard est un site statique : `npm run build` produit `dist/`, servi tel quel (routage par `#`, aucune règle de
réécriture). `render.yaml` décrit le service : branche `master`, Node 24, en-têtes de sécurité, cache des assets.

1. Déployer d'abord l'API (voir son README) et noter son URL publique.
2. Render → _New → Blueprint_ → ce dépôt : renseigner `VITE_API_BASE_URL` (URL de l'API, sans slash final) et
   `VITE_GOOGLE_CLIENT_ID`. Ces variables sont lues **au build** : après une modification, redéployer.
3. Côté API : ajouter l'URL du dashboard à `CORS_ORIGINS` (`["https://auth-console.onrender.com"]`).
4. Google Cloud Console : ajouter l'URL du dashboard aux « Origines JavaScript autorisées » du Client ID.

Un site statique Render ne se met pas en veille ; l'API (offre gratuite) si : la première requête après 15 min
d'inactivité prend environ 50 s.

## Architecture

Organisation par fonctionnalité :

```
src/
├── main.tsx, App.tsx     # point d'entrée ; App choisit la page selon l'URL (#/...)
├── app/                  # providers (thème, toasts…), table des routes
├── config/env.ts         # variables d'environnement typées
├── lib/                  # http.ts (client API unique), router.ts (routage par hash)
├── features/<domaine>/   # logique métier par domaine : schémas zod, hooks, composants
├── pages/                # une page par route, chargée à la demande
├── components/           # composants partagés (AppShell, PageHeader, Link…)
└── test/                 # configuration des tests
```

Règles :

- Dépendances à sens unique : `pages → features → components / lib / config`. Une feature n'importe une autre feature que
  via son `index.ts`.
- Pas de `fetch` en dehors de `lib/http.ts`. Il ajoute le token et l'en-tête `X-Tenant-Id`, transforme les erreurs de
  l'API (`{ error: { code, message } }`) en `ApiError`, et renouvelle la session une fois si l'access token est expiré ou
  révoqué.
- Composants QuickadUI d'abord ; couleurs uniquement via les tokens sémantiques (`bg-neutral-1`, `text-accent-11`…) pour
  que le mode sombre fonctionne.

## Authentification

| Page                | Route                         | Parcours                                                                                             |
| ------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| Inscription         | `#/register`                  | Aucune session ouverte : redirection vers la vérification de l'e-mail                                |
| Vérification        | `#/verify-email?email=...`    | Code à 6 chiffres reçu par e-mail → session ouverte ; renvoi possible                                |
| Connexion           | `#/login`                     | Mot de passe → code MFA reçu par e-mail → session ouverte                                            |
| Google              | `#/login`, `#/register`       | « Continuer avec Google » → session ouverte (compte créé au premier passage)                         |
| Mot de passe oublié | `#/forgot-password?email=...` | E-mail → code reçu → nouveau mot de passe (toutes les sessions sont fermées) → retour à la connexion |

- Les pages privées redirigent vers `#/login` sans session ; les pages de connexion redirigent vers `#/` avec une session.
- **Session** : l'access token reste en mémoire ; le refresh token et l'identité du tenant sont en `localStorage` pour
  survivre à un rechargement. Au démarrage, la session est renouvelée. Un token expiré ou révoqué déclenche un seul
  renouvellement, même si plusieurs requêtes échouent en même temps (le refresh token est à usage unique).
- **Limite connue** : un refresh token en `localStorage` est lisible par un script injecté (XSS). Un cookie `httpOnly`
  posé par l'API supprimerait ce risque.
- Les règles de mot de passe de l'API sont définies une seule fois (`features/auth/schemas.ts`) : validation zod et
  indicateur de robustesse.

## Applications

| Page         | Route                          | Contenu                                                                                                                                                                                      |
| ------------ | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Liste        | `#/apps?page=1`                | Applications du tenant, paginées (page dans l'URL) ; jamais de secret affiché                                                                                                                |
| Création     | `#/apps/new`                   | Informations obligatoires, réglages de sécurité pré-remplis (durées, MFA, vérification d'e-mail et mot de passe oublié par code ou par lien, pages de succès / échec), apparence des e-mails |
| Détail       | `#/apps/:appId`                | Identifiants (secret masqué, copiable), apparence des e-mails (aperçu, e-mail de test), URLs et vérification (modifiables), Client ID Google, activation, rotation du secret                 |
| Utilisateurs | `#/apps/:appId/users?q=&page=` | Comptes de l'application : recherche par e-mail, statut, Google / MFA / e-mail non vérifié, détail, blocage (ferme ses sessions) et suppression avec confirmation                            |

Chaque vue gère les états chargement, erreur (avec « Réessayer »), vide et données.

## Profil

`#/profile` (menu utilisateur → « Mon profil ») : prénom et nom modifiables (règles de l'API), e-mail en lecture seule.
Après l'enregistrement, la session est mise à jour : le nouveau nom apparaît aussitôt dans le menu, sans reconnexion.

## Documentation « Comment commencer »

`#/docs` (barre latérale) : guide pas à pas pour brancher l'authentification sur une
application Node + React. La page est publique : lisible sans compte, dans le dashboard une fois connecté.

- Le contenu vit dans `src/features/docs`, qui ne dépend d'aucune autre feature : il pourra être extrait vers un site
  de documentation déployé séparément.
- Les exemples (`src/features/docs/examples/`) sont de vrais fichiers importés avec `?raw` : la page affiche exactement
  le code testé (`examples.test.tsx`). Le back d'exemple `server.mjs` a été vérifié de bout en bout contre l'API.

## Charte graphique

- Palette dans `src/styles/brand.css` : elle remplace les couleurs `neutral` et `accent` de QuickadUI (fonds ivoire en
  clair, brun chaud en sombre, accent orange doux).
- Boutons : toujours `Button` / `IconButton` de `@/components/Button` (principal noir en clair, blanc en sombre ;
  secondaires neutres). Une règle ESLint interdit d'importer ceux de `@quickadui/core` directement.

## Test de contrat avec l'API réelle

`src/api/*.contract.test.ts` (auth, applications et utilisateurs) vérifie que les réponses de la vraie API correspondent aux schémas du front. Ignoré par
`npm test` ; à lancer avec l'API démarrée (par exemple `docker compose up` dans auth-web-app-api, e-mails en console).
Les appels visent uniquement `API_CONTRACT_URL` (et non `VITE_API_BASE_URL`) : pointez-la vers une API de test, jamais
vers une API branchée sur une vraie base, car le test crée des comptes et envoie des e-mails. Lancer les fichiers un par
un (`--no-file-parallelism`) pour que chaque test lise son propre code :

```bash
API_CONTRACT_URL=http://localhost:8080 API_CONTRACT_CODE_CMD='docker compose -f ../auth-web-app-api/docker-compose.yml logs api --since 20s | grep -o "\"code\":\"[0-9]\{6\}\"" | tail -1 | grep -o "[0-9]\{6\}"' npx vitest run src/api --no-file-parallelism
```

## Choix techniques

- **TypeScript 6** et non 7 : TypeScript 7 (réécrit en Go) n'expose pas l'API JavaScript dont ESLint a besoin.
- **Routage par hash** (`#/apps`) : aucun réglage serveur nécessaire pour un hébergement statique.
