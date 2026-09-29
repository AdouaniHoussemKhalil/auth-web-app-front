import { authApi } from "@/api/auth.api";
import { FormError } from "@/components/FormError";
import { env } from "@/config/env";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { loadGoogleIdentity } from "@/lib/googleIdentity";
import { navigate } from "@/lib/router";
import { Typography } from "@quickadui/core";
import { Flex, Stack } from "@quickadui/layout";
import { useTheme } from "@quickadui/theme";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";

// Largeurs acceptées par le bouton Google (en pixels).
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

/**
 * Séparateur « ou » puis bouton « Continuer avec Google », à placer sous le bouton principal d'un
 * formulaire. Google renvoie un ID token, échangé auprès de l'API contre une session (le compte est
 * créé au premier passage, e-mail déjà vérifié). Rien n'est affiché si VITE_GOOGLE_CLIENT_ID n'est pas défini.
 */
export function GoogleSignIn() {
  const clientId = env.googleClientId;
  const { openSession } = useAuth();
  const { resolvedTheme } = useTheme();
  const container = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);

  const signIn = useAsyncAction(
    useCallback(
      async (credential: string) => {
        openSession(await authApi.googleSignIn(credential));
        navigate("/", { replace: true });
      },
      [openSession],
    ),
  );
  // Le bouton Google garde le callback de son initialisation : il passe par une référence à jour.
  const run = useRef(signIn.run);
  useEffect(() => {
    run.current = signIn.run;
  });

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    loadGoogleIdentity().then(
      (google) => {
        const parent = container.current;
        if (cancelled || !parent) return;
        google.initialize({
          client_id: clientId,
          callback: ({ credential }) => void run.current(credential),
        });
        parent.replaceChildren();
        google.renderButton(parent, {
          theme: resolvedTheme === "dark" ? "filled_black" : "outline",
          text: "continue_with",
          size: "large",
          shape: "rectangular",
          // Même largeur que le bouton principal du formulaire, dans les limites de Google.
          width: Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parent.offsetWidth || MAX_WIDTH)),
          locale: "fr",
        });
      },
      () => {
        if (!cancelled) setUnavailable(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [clientId, resolvedTheme]);

  if (!clientId) return null;

  return (
    <Stack gap="md" className="mt-4">
      <Flex align="center" gap="sm" aria-hidden="true">
        <span className="h-px flex-1 bg-neutral-6" />
        <Typography variant="small" className="text-neutral-11">
          ou
        </Typography>
        <span className="h-px flex-1 bg-neutral-6" />
      </Flex>
      {unavailable ? (
        <Typography variant="muted" role="status" className="text-center">
          La connexion Google est indisponible pour le moment.
        </Typography>
      ) : (
        <div
          ref={container}
          className="flex min-h-10 w-full justify-center"
          aria-busy={signIn.isPending}
        />
      )}
      <FormError>{signIn.error}</FormError>
    </Stack>
  );
}
