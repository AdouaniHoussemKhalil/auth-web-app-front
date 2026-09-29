// Seul point de lecture de import.meta.env : le reste du code importe `env`.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const env = {
  /** URL de auth-web-app-api, sans slash final. */
  apiBaseUrl: (apiBaseUrl ?? "http://localhost:8080").replace(/\/+$/, ""),
} as const;
