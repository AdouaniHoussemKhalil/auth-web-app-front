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

export interface GoogleSignInProps {
  /** Libellé du bouton Google : « Se connecter avec Google » ou « S'inscrire avec Google ». */
  text: "signin_with" | "signup_with";
}

/**
 * Bouton « Continuer avec Google » suivi d'un séparateur « ou ». Google renvoie un ID token, échangé
 * auprès de l'API contre une session (le compte est créé au premier passage, e-mail déjà vérifié).
 * Rien n'est affiché si VITE_GOOGLE_CLIENT_ID n'est pas défini.
 */
export function GoogleSignIn({ text }: GoogleSignInProps) {
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
          text,
          size: "large",
          shape: "pill",
          width: Math.min(400, parent.offsetWidth || 320),
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
  }, [clientId, resolvedTheme, text]);

  if (!clientId) return null;

  return (
    <Stack gap="md" className="mb-6">
      {unavailable ? (
        <Typography variant="muted" role="status">
          La connexion Google est indisponible pour le moment.
        </Typography>
      ) : (
        <div
          ref={container}
          className="flex min-h-10 justify-center"
          aria-busy={signIn.isPending}
        />
      )}
      <FormError>{signIn.error}</FormError>
      <Flex align="center" gap="sm" aria-hidden="true">
        <span className="h-px flex-1 bg-neutral-6" />
        <Typography variant="small" className="text-neutral-11">
          ou
        </Typography>
        <span className="h-px flex-1 bg-neutral-6" />
      </Flex>
    </Stack>
  );
}
