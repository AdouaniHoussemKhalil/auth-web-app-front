import { consumersApi } from "@/api/consumers.api";
import { useAuth } from "@/features/auth";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useCallback } from "react";

/** Blocage / déblocage et suppression des utilisateurs d'une application du tenant connecté. */
export const useConsumerActions = (appId: string) => {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? "";

  const setActive = useAsyncAction(
    useCallback(
      (consumerId: string, isActive: boolean) =>
        consumersApi.setActive(tenantId, appId, consumerId, isActive),
      [tenantId, appId],
    ),
  );

  const remove = useAsyncAction(
    useCallback(
      (consumerId: string) => consumersApi.remove(tenantId, appId, consumerId),
      [tenantId, appId],
    ),
  );

  return { setActive, remove };
};
