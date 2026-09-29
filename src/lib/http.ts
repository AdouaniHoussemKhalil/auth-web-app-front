import { env } from "@/config/env";

/** Erreur renvoyée par l'API (format `{ error: { status, code, message, details } }`) ou par le réseau. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, details: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Branchement de la session (fourni par la feature auth) : le client HTTP ne connaît ni le stockage
 * des tokens ni la logique de renouvellement, seulement ces trois fonctions.
 */
export interface HttpAuthHandlers {
  getAccessToken: () => string | null;
  getTenantId: () => string | null;
  /** Renouvelle la session ; renvoie false si c'est impossible (l'utilisateur doit se reconnecter). */
  refreshSession: () => Promise<boolean>;
}

let authHandlers: HttpAuthHandlers | null = null;

export const configureHttpAuth = (handlers: HttpAuthHandlers | null) => {
  authHandlers = handlers;
};

export interface HttpOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | undefined;
  body?: unknown;
  /** Joint le token et l'en-tête X-Tenant-Id. Défaut : true. */
  auth?: boolean | undefined;
  query?: Record<string, string | number | undefined> | undefined;
  signal?: AbortSignal | undefined;
}

// Codes de l'API qui signalent un access token absent, invalide ou révoqué : un refresh peut réparer.
const SESSION_ERROR_CODES = new Set(["missingToken", "invalidToken"]);

const buildUrl = (path: string, query?: HttpOptions["query"]) => {
  const url = new URL(env.apiBaseUrl + path);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  return url.toString();
};

const toApiError = async (response: Response): Promise<ApiError> => {
  const body = await response.json().catch(() => null);
  const error = body?.error;
  if (error?.code) {
    return new ApiError(response.status, error.code, error.message ?? "", error.details ?? null);
  }
  return new ApiError(response.status, "httpError", body?.message ?? response.statusText);
};

const send = async (path: string, options: HttpOptions) => {
  const { method = "GET", body, auth = true, query, signal } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth && authHandlers) {
    const token = authHandlers.getAccessToken();
    const tenantId = authHandlers.getTenantId();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (tenantId) headers["X-Tenant-Id"] = tenantId;
  }

  try {
    return await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new ApiError(0, "networkError", "Impossible de joindre le serveur");
  }
};

/**
 * Seul point d'accès HTTP de l'application. Renvoie le corps JSON typé, ou lève une ApiError.
 * Sur un access token expiré ou révoqué, renouvelle la session une fois puis rejoue la requête.
 */
export async function http<T>(path: string, options: HttpOptions = {}): Promise<T> {
  let response = await send(path, options);

  if (!response.ok && options.auth !== false && authHandlers) {
    const error = await toApiError(response.clone());
    if (SESSION_ERROR_CODES.has(error.code) && (await authHandlers.refreshSession())) {
      response = await send(path, options);
    }
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
