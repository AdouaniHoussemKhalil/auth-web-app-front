import { appsApi } from "@/api/apps.api";
import { useAuth } from "@/features/auth";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useCallback } from "react";
import {
  toCreateAppBody,
  type AppSettingsValues,
  type CreateAppValues,
  type EmailBrandingValues,
} from "../schemas";

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

  const setGoogleClientId = useAsyncAction(
    useCallback(
      (appId: string, googleClientId: string | null) =>
        appsApi.setGoogleClientId(tenantId, appId, googleClientId),
      [tenantId],
    ),
  );

  const updateBranding = useAsyncAction(
    useCallback(
      (appId: string, values: EmailBrandingValues) =>
        appsApi.updateBranding(tenantId, appId, {
          name: values.name,
          supportEmail: values.supportEmail,
          // Champ vidé : retour à la valeur par défaut (pas de logo, couleur neutre).
          logoUrl: values.logoUrl || null,
          primaryColor: values.primaryColor || null,
        }),
      [tenantId],
    ),
  );

  const updateSettings = useAsyncAction(
    useCallback(
      (appId: string, values: AppSettingsValues) =>
        appsApi.updateSettings(tenantId, appId, {
          ...values,
          // Champ vidé : l'URL optionnelle est retirée.
          logoutUrl: values.logoutUrl || null,
          emailVerifiedUrl: values.emailVerifiedUrl || null,
          emailVerificationFailedUrl: values.emailVerificationFailedUrl || null,
        }),
      [tenantId],
    ),
  );

  const sendTestEmail = useAsyncAction(
    useCallback((appId: string) => appsApi.sendTestEmail(tenantId, appId), [tenantId]),
  );

  const rotateSecret = useAsyncAction(
    useCallback((appId: string) => appsApi.rotateSecret(tenantId, appId), [tenantId]),
  );

  return {
    create,
    setActive,
    setGoogleClientId,
    updateBranding,
    updateSettings,
    sendTestEmail,
    rotateSecret,
  };
};
