/**
 * Chargement à la demande de Google Identity Services (bouton « Continuer avec Google »).
 * Le script n'est ajouté à la page que lorsqu'un bouton Google est affiché.
 */
const SCRIPT_URL = "https://accounts.google.com/gsi/client";

export interface GoogleButtonOptions {
  theme: "outline" | "filled_black";
  text: "signin_with" | "signup_with" | "continue_with";
  size: "large";
  shape: "pill" | "rectangular";
  width: number;
  locale: string;
}

/** Sous-ensemble de `google.accounts.id` utilisé par le dashboard. */
export interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
  }) => void;
  renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void;
}

// Objet global posé par le script Google (non déclaré globalement : l'exemple de la doc a son propre type).
const googleId = () =>
  (window as unknown as { google?: { accounts?: { id?: GoogleAccountsId } } }).google?.accounts?.id;

let loading: Promise<GoogleAccountsId> | null = null;

export const loadGoogleIdentity = (): Promise<GoogleAccountsId> => {
  const ready = googleId();
  if (ready) return Promise.resolve(ready);

  loading ??= new Promise<GoogleAccountsId>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      const id = googleId();
      if (id) resolve(id);
      else reject(new Error("Google Identity Services unavailable"));
    };
    script.onerror = () => {
      // Un nouvel essai rechargera le script (réseau revenu, bloqueur désactivé…).
      loading = null;
      script.remove();
      reject(new Error("Google Identity Services failed to load"));
    };
    document.head.appendChild(script);
  });
  return loading;
};
