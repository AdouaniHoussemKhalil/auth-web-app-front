// LoginPage.tsx — page de connexion de VOTRE application React.
// Elle appelle votre back (server.mjs), jamais directement l'API d'authentification.
import { useState, type FormEvent } from "react";

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

async function post(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  // Format d'erreur de l'API : { error: { code, message } }
  if (!response.ok) throw new Error(data.error?.message ?? "Erreur inattendue");
  return data;
}

export function LoginPage({ onLoggedIn }: { onLoggedIn: (tokens: Tokens) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const data = mfaRequired
        ? await post("/auth/login/mfa", { email, mfaCode })
        : await post("/auth/login", { email, password });

      if (data.MFARequired) {
        // MFA actif : l'API vient d'envoyer un code à 6 chiffres par e-mail.
        setMfaRequired(true);
        return;
      }
      onLoggedIn({ accessToken: data.access_token, refreshToken: data.refresh_token });
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {mfaRequired ? (
        <label>
          Code reçu par e-mail
          <input value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} />
        </label>
      ) : (
        <>
          <label>
            E-mail
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Mot de passe
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
        </>
      )}
      {error && <p role="alert">{error}</p>}
      <button type="submit">{mfaRequired ? "Valider le code" : "Se connecter"}</button>
    </form>
  );
}

/** Appel d'une route protégée de votre back avec l'access token. */
export async function fetchProfile(tokens: Tokens) {
  const response = await fetch("/api/profile", {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });
  if (response.status === 401) throw new Error("Session expirée : appelez /auth/refresh");
  return response.json();
}
