import { appsApi } from "@/api/apps.api";
import { useAuth } from "@/features/auth";
import { useResource } from "@/hooks/useResource";

export const APPS_PAGE_SIZE = 10;

/** Applications du tenant connecté, paginées. */
export const useApps = (page: number) => {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? "";
  return useResource(
    (signal) => appsApi.list(tenantId, page, APPS_PAGE_SIZE, signal),
    [tenantId, page],
  );
};

/** Une application du tenant connecté (avec son secret). */
export const useApp = (appId: string) => {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? "";
  return useResource((signal) => appsApi.get(tenantId, appId, signal), [tenantId, appId]);
};
