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

## Choix techniques

- **TypeScript 6** et non 7 : TypeScript 7 (réécrit en Go) n'expose pas l'API JavaScript dont ESLint a besoin.
- **Routage par hash** (`#/apps`) : aucun réglage serveur nécessaire pour un hébergement statique.
