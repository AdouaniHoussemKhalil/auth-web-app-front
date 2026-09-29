import { authApi } from "@/api/auth.api";
import { useAuth } from "@/features/auth";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useCallback } from "react";
import type { ProfileValues } from "../schemas";

/** Modifie le profil du tenant connecté puis met la session à jour (nom affiché dans le menu). */
export const useUpdateProfile = () => {
  const { user, updateUser } = useAuth();
  const tenantId = user?.tenantId ?? "";

  return useAsyncAction(
    useCallback(
      async ({ firstName, lastName }: ProfileValues) => {
        const updated = await authApi.updateProfile(tenantId, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
        updateUser(updated);
        return updated;
      },
      [tenantId, updateUser],
    ),
  );
};
