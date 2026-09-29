import { appsApi } from "@/api/apps.api";
import { useAuth } from "@/features/auth";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useCallback } from "react";
import { toCreateAppBody, type CreateAppValues } from "../schemas";

/** Actions d'écriture sur les applications du tenant connecté. */
export const useAppActions = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? "";

  const create = useAsyncAction(
    useCallback(
      (values: CreateAppValues) => appsApi.create(tenantId, toCreateAppBody(values)),
      [tenantId],
    ),
  );

  const setActive = useAsyncAction(
    useCallback(
      (appId: string, isActive: boolean) => appsApi.setActive(tenantId, appId, isActive),
      [tenantId],
    ),
  );

  const rotateSecret = useAsyncAction(
    useCallback((appId: string) => appsApi.rotateSecret(tenantId, appId), [tenantId]),
  );

  return { create, setActive, rotateSecret };
};
