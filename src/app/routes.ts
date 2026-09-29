import { lazy, type ComponentType, type LazyExoticComponent } from "react";

export interface RouteDefinition {
  path: string;
  /** Page chargée à la demande (découpage du bundle). Reçoit les paramètres de l'URL. */
  page: LazyExoticComponent<ComponentType<{ params: Record<string, string> }>>;
}

// Table des routes, dans l'ordre de priorité. Les routes publiques (connexion…) arrivent avec la feature auth.
export const routes: RouteDefinition[] = [
  { path: "/", page: lazy(() => import("@/pages/HomePage")) },
];

export const notFoundPage = lazy(() => import("@/pages/NotFoundPage"));
