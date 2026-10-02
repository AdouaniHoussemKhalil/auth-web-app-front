import { consumersApi } from "@/api/consumers.api";
import { useAuth } from "@/features/auth";
import { useResource } from "@/hooks/useResource";

export const CONSUMERS_PAGE_SIZE = 20;

/** Utilisateurs d'une application du tenant connecté, paginés, filtrés par e-mail. */
export const useConsumers = (appId: string, page: number, email: string) => {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? "";
  return useResource(
    (signal) =>
      consumersApi.list(tenantId, appId, { page, limit: CONSUMERS_PAGE_SIZE, email }, signal),
    [tenantId, appId, page, email],
  );
};
