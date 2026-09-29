// GoogleButton.tsx — bouton « Se connecter avec Google » de VOTRE application React.
// Dans index.html : <script src="https://accounts.google.com/gsi/client" async></script>
// Usage : <GoogleButton clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID} onLoggedIn={…} onMfaRequired={…} />
import { useEffect, useRef, useState } from "react";
import type { Tokens } from "./LoginPage";

interface GoogleIdentity {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, string>) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentity } };
  }
}

/** L'e-mail du compte Google, lu dans l'ID token (utile pour la seconde étape du MFA). */
const emailFromCredential = (credential: string): string =>
  JSON.parse(atob(credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).email;

export interface GoogleButtonProps {
  clientId: string;
  onLoggedIn: (tokens: Tokens) => void;
  /** MFA actif : un code a été envoyé par e-mail, à valider sur /auth/login/mfa avec cet e-mail. */
  onMfaRequired: (email: string) => void;
}

export function GoogleButton({ clientId, onLoggedIn, onMfaRequired }: GoogleButtonProps) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const google = window.google?.accounts.id;
    if (!google || !container.current) return;

    google.initialize({
      client_id: clientId,
      // Google renvoie un ID token : votre back l'échange contre une session (route /auth/google).
      callback: async ({ credential }) => {
        setError(null);
        const response = await fetch("/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: credential }),
        });
        const data = await response.json();
        if (!response.ok) return setError(data.error?.message ?? "Connexion Google impossible");
        if (data.MFARequired) return onMfaRequired(emailFromCredential(credential));
        onLoggedIn({ accessToken: data.access_token, refreshToken: data.refresh_token });
      },
    });
    google.renderButton(container.current, { theme: "outline", text: "continue_with" });
  }, [clientId, onLoggedIn, onMfaRequired]);

  return (
    <div>
      <div ref={container} />
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
