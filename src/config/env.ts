// Seul point de lecture de import.meta.env : le reste du code importe `env`.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export const env = {
  /** URL de auth-web-app-api, sans slash final. */
  apiBaseUrl: (apiBaseUrl ?? "http://localhost:8080").replace(/\/+$/, ""),
  /** Client ID OAuth Google du dashboard (le même que `google.clientId` de l'API) ; null : pas de bouton Google. */
  googleClientId: googleClientId?.trim() || null,
} as const;
