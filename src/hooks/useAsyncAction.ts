import { useCallback, useState } from "react";
import { getErrorMessage } from "@/lib/errorMessages";
import { ApiError } from "@/lib/http";

/**
 * Exécute une action asynchrone en exposant son état : chargement, message d'erreur lisible,
 * et code d'erreur de l'API (pour réagir à un cas précis, comme `emailNotVerified`).
 */
export const useAsyncAction = <Args extends unknown[], Result>(
  action: (...args: Args) => Promise<Result>,
) => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<{ message: string; code: string | null } | null>(null);

  const run = useCallback(
    async (...args: Args): Promise<Result | undefined> => {
      setIsPending(true);
      setError(null);
      try {
        return await action(...args);
      } catch (caught) {
        setError({
          message: getErrorMessage(caught),
          code: caught instanceof ApiError ? caught.code : null,
        });
        return undefined;
      } finally {
        setIsPending(false);
      }
    },
    [action],
  );

  return { run, isPending, error: error?.message ?? null, errorCode: error?.code ?? null };
};
