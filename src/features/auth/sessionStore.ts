import { authApi } from "@/api/auth.api";
import type { TenantUser, TokenPair } from "@/api/auth.api";

/**
 * Session du tenant.
 * - access token : en mémoire uniquement (perdu au rechargement, renouvelé aussitôt) ;
 * - refresh token + identité : localStorage, pour survivre au rechargement de la page.
 *   Limite connue : lisible par un script injecté (XSS). Un cookie httpOnly posé par l'API supprimerait ce risque.
 */
export const STORAGE_KEY = "auth-console-session";

interface StoredSession {
  refreshToken: string;
  user: TenantUser;
}

let accessToken: string | null = null;
let stored: StoredSession | null = null;
let refreshing: Promise<boolean> | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

const persist = (session: StoredSession | null) => {
  stored = session;
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Stockage indisponible (navigation privée stricte) : la session reste valable pour l'onglet.
  }
};

export const sessionStore = {
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getAccessToken: () => accessToken,
  getUser: () => stored?.user ?? null,
  getTenantId: () => stored?.user.tenantId ?? null,

  /** Relit la session enregistrée (au démarrage de l'application). */
  load: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      stored = raw ? (JSON.parse(raw) as StoredSession) : null;
    } catch {
      stored = null;
    }
    return stored !== null;
  },

  open: ({ access_token, refresh_token }: TokenPair, user: TenantUser) => {
    accessToken = access_token;
    persist({ refreshToken: refresh_token, user });
    notify();
  },

  /** Met à jour l'identité affichée (après une modification du profil), sans toucher aux tokens. */
  updateUser: (user: TenantUser) => {
    if (!stored) return;
    persist({ ...stored, user });
    notify();
  },

  clear: () => {
    accessToken = null;
    persist(null);
    notify();
  },

  /**
   * Échange le refresh token contre une nouvelle paire. Les appels simultanés partagent la même
   * requête : le refresh token étant à usage unique, deux requêtes parallèles révoqueraient la session.
   */
  refresh: (): Promise<boolean> => {
    if (refreshing) return refreshing;
    const current = stored;
    if (!current) return Promise.resolve(false);

    refreshing = authApi
      .refresh(current.refreshToken)
      .then((tokens) => {
        sessionStore.open(tokens, current.user);
        return true;
      })
      .catch(() => {
        sessionStore.clear();
        return false;
      })
      .finally(() => {
        refreshing = null;
      });
    return refreshing;
  },

  /** Déconnexion : révoque le refresh token côté API (au mieux), puis efface la session locale. */
  logout: async () => {
    const refreshToken = stored?.refreshToken;
    sessionStore.clear();
    if (refreshToken) await authApi.logout(refreshToken).catch(() => undefined);
  },
};
