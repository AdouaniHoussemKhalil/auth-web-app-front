import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { AuthenticatedResponse } from "@/api/auth.api";
import { configureHttpAuth } from "@/lib/http";
import { AuthContext, type AuthContextValue } from "./authContext";
import { sessionStore } from "./sessionStore";

/**
 * Fournit la session à l'application et la branche sur le client HTTP.
 * Au démarrage, une session enregistrée est renouvelée (l'access token n'est jamais stocké).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(sessionStore.subscribe, sessionStore.getUser, () => null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    configureHttpAuth({
      getAccessToken: sessionStore.getAccessToken,
      getTenantId: sessionStore.getTenantId,
      refreshSession: sessionStore.refresh,
    });

    let cancelled = false;
    const restore = sessionStore.load() ? sessionStore.refresh() : Promise.resolve(false);
    void restore.finally(() => {
      if (!cancelled) setRestoring(false);
    });

    return () => {
      cancelled = true;
      configureHttpAuth(null);
    };
  }, []);

  const openSession = useCallback(({ user: tenant, ...tokens }: AuthenticatedResponse) => {
    sessionStore.open(tokens, tenant);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: restoring ? "loading" : user ? "authenticated" : "anonymous",
      user,
      openSession,
      logout: sessionStore.logout,
    }),
    [restoring, user, openSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
