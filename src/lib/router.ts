import { useSyncExternalStore } from "react";

/**
 * Routeur minimal par hash (`#/apps/42`), comme celui généré par create-quickadui : pas de
 * configuration serveur nécessaire pour un hébergement statique.
 */
const readPath = () => {
  const path = window.location.hash.replace(/^#/, "").split("?")[0];
  return path.startsWith("/") ? path : "/";
};

const subscribe = (callback: () => void) => {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
};

const readQuery = () => window.location.hash.split("?")[1] ?? "";

/** Paramètre de la query string du hash (`#/verify-email?email=a@b.c` -> "a@b.c"), réactif. */
export const useQueryParam = (name: string) => {
  const query = useSyncExternalStore(subscribe, readQuery, () => "");
  return new URLSearchParams(query).get(name);
};

/** Construit un chemin avec query string : `withQuery("/verify-email", { email })`. */
export const withQuery = (path: string, params: Record<string, string>) =>
  `${path}?${new URLSearchParams(params).toString()}`;

/** Chemin courant (sans le `#` ni la query string), réactif aux changements de hash. */
export const usePath = () => useSyncExternalStore(subscribe, readPath, () => "/");

export const navigate = (to: string, { replace = false }: { replace?: boolean } = {}) => {
  if (replace) {
    window.location.replace(`#${to}`);
  } else {
    window.location.hash = to;
  }
};

/** `matchPath("/apps/:appId", "/apps/42")` -> `{ appId: "42" }` ; null si le chemin ne correspond pas. */
export const matchPath = (pattern: string, path: string): Record<string, string> | null => {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (const [index, part] of patternParts.entries()) {
    const value = pathParts[index];
    if (part.startsWith(":")) {
      params[part.slice(1)] = decodeURIComponent(value);
    } else if (part !== value) {
      return null;
    }
  }
  return params;
};
