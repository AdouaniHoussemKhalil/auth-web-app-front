import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/errorMessages";

export interface ResourceState<T> {
  /** Dernière donnée chargée ; conservée pendant un rechargement. */
  data: T | undefined;
  isLoading: boolean;
  error: string | null;
  /** Recharge la donnée (après une modification, ou sur « Réessayer »). */
  reload: () => void;
  /** Remplace la donnée localement, sans appel réseau (après une mise à jour réussie). */
  setData: (data: T) => void;
}

type Settled<T> = { key: string | null; data: T | undefined; error: string | null };

/**
 * Charge une donnée à chaque changement de `deps` (valeurs simples : chaînes, nombres).
 * La requête précédente est annulée, pour qu'une réponse lente n'écrase pas une plus récente.
 * L'état « chargement » est déduit : la dernière réponse reçue ne correspond pas à la requête courante.
 */
export const useResource = <T>(
  load: (signal: AbortSignal) => Promise<T>,
  deps: ReadonlyArray<string | number | boolean>,
): ResourceState<T> => {
  const [version, setVersion] = useState(0);
  const [settled, setSettled] = useState<Settled<T>>({ key: null, data: undefined, error: null });
  const key = JSON.stringify([...deps, version]);

  useEffect(() => {
    const controller = new AbortController();

    load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setSettled({ key, data, error: null });
      },
      (caught: unknown) => {
        if (!controller.signal.aborted) {
          setSettled((previous) => ({ key, data: previous.data, error: getErrorMessage(caught) }));
        }
      },
    );

    return () => controller.abort();
    // `load` est recréée à chaque rendu : c'est `key` (deps + version) qui décide du rechargement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);
  const setData = useCallback((data: T) => setSettled({ key, data, error: null }), [key]);

  return {
    data: settled.data,
    isLoading: settled.key !== key,
    error: settled.key === key ? settled.error : null,
    reload,
    setData,
  };
};
