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

## Configuration

| Variable            | Défaut                  | Rôle                           |
| ------------------- | ----------------------- | ------------------------------ |
| `VITE_API_BASE_URL` | `http://localhost:8080` | URL de l'API, sans slash final |

Les variables sont lues uniquement dans `src/config/env.ts`.

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

| Page         | Route                      | Parcours                                                              |
| ------------ | -------------------------- | --------------------------------------------------------------------- |
| Inscription  | `#/register`               | Aucune session ouverte : redirection vers la vérification de l'e-mail |
| Vérification | `#/verify-email?email=...` | Code à 6 chiffres reçu par e-mail → session ouverte ; renvoi possible |
| Connexion    | `#/login`                  | Mot de passe → code MFA reçu par e-mail → session ouverte             |

- Les pages privées redirigent vers `#/login` sans session ; les pages de connexion redirigent vers `#/` avec une session.
- **Session** : l'access token reste en mémoire ; le refresh token et l'identité du tenant sont en `localStorage` pour
  survivre à un rechargement. Au démarrage, la session est renouvelée. Un token expiré ou révoqué déclenche un seul
  renouvellement, même si plusieurs requêtes échouent en même temps (le refresh token est à usage unique).
- **Limite connue** : un refresh token en `localStorage` est lisible par un script injecté (XSS). Un cookie `httpOnly`
  posé par l'API supprimerait ce risque.
- Les règles de mot de passe de l'API sont définies une seule fois (`features/auth/schemas.ts`) : validation zod et
  indicateur de robustesse.

## Test de contrat avec l'API réelle

`src/api/*.contract.test.ts` vérifie que les réponses de la vraie API correspondent aux schémas du front. Ignoré par
`npm test` ; à lancer avec l'API démarrée (par exemple `docker compose up` dans auth-web-app-api, e-mails en console) :

```bash
API_CONTRACT_URL=http://localhost:8080 API_CONTRACT_CODE_CMD='docker compose -f ../auth-web-app-api/docker-compose.yml logs api --since 20s | grep -o "\"code\":\"[0-9]\{6\}\"" | tail -1 | grep -o "[0-9]\{6\}"' npx vitest run src/api/auth.api.contract.test.ts
```

## Choix techniques

- **TypeScript 6** et non 7 : TypeScript 7 (réécrit en Go) n'expose pas l'API JavaScript dont ESLint a besoin.
- **Routage par hash** (`#/apps`) : aucun réglage serveur nécessaire pour un hébergement statique.
