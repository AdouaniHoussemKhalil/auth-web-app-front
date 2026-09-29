import { lazy, type ComponentType, type LazyExoticComponent } from "react";

export interface RouteDefinition {
  path: string;
  /**
   * - "private" : session requise, affichée dans le shell (redirection vers /login sinon) ;
   * - "guest" : pages de connexion, réservées aux visiteurs non connectés (redirection vers / sinon) ;
   * - "public" : lisible par tous (documentation) ; dans le shell si connecté.
   */
  access: "private" | "guest" | "public";
  /** Page chargée à la demande (découpage du bundle). Reçoit les paramètres de l'URL. */
  page: LazyExoticComponent<ComponentType<{ params: Record<string, string> }>>;
}

// Table des routes, dans l'ordre de priorité.
export const routes: RouteDefinition[] = [
  { path: "/login", access: "guest", page: lazy(() => import("@/pages/auth/LoginPage")) },
  { path: "/register", access: "guest", page: lazy(() => import("@/pages/auth/RegisterPage")) },
  {
    path: "/forgot-password",
    access: "guest",
    page: lazy(() => import("@/pages/auth/ForgotPasswordPage")),
  },
  {
    path: "/verify-email",
    access: "guest",
    page: lazy(() => import("@/pages/auth/VerifyEmailPage")),
  },
  { path: "/docs", access: "public", page: lazy(() => import("@/pages/docs/DocsPage")) },
  { path: "/", access: "private", page: lazy(() => import("@/pages/HomePage")) },
  { path: "/profile", access: "private", page: lazy(() => import("@/pages/account/ProfilePage")) },
  { path: "/apps", access: "private", page: lazy(() => import("@/pages/apps/AppsListPage")) },
  // "/apps/new" avant "/apps/:appId", sinon "new" serait pris pour un identifiant.
  { path: "/apps/new", access: "private", page: lazy(() => import("@/pages/apps/AppCreatePage")) },
  {
    path: "/apps/:appId",
    access: "private",
    page: lazy(() => import("@/pages/apps/AppDetailPage")),
  },
];

export const notFoundPage = lazy(() => import("@/pages/NotFoundPage"));

export const LOGIN_PATH = "/login";
export const HOME_PATH = "/";
