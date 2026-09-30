import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "@/App";
import { Providers } from "@/app/providers";
import { sessionStore } from "@/features/auth/sessionStore";
import { loadGoogleIdentity, type GoogleAccountsId } from "@/lib/googleIdentity";
import { apiError, mockApi, tenant, tokens } from "@/test/mockApi";

const mockEnv = vi.hoisted(() => ({
  apiBaseUrl: "http://localhost:8080",
  googleClientId: "dashboard.apps.googleusercontent.com" as string | null,
}));
vi.mock("@/config/env", () => ({ env: mockEnv }));
vi.mock("@/lib/googleIdentity", () => ({ loadGoogleIdentity: vi.fn() }));

/** Faux Google Identity Services : le bouton rendu déclenche le callback avec un ID token. */
const fakeGoogle = () => {
  let callback: (response: { credential: string }) => void = () => {};
  const google: GoogleAccountsId = {
    initialize: vi.fn((config) => {
      callback = config.callback;
    }),
    renderButton: vi.fn((parent, options) => {
      const button = document.createElement("button");
      button.textContent = options.text === "continue_with" ? "Continuer avec Google" : "?";
      button.onclick = () => callback({ credential: "google-id-token" });
      parent.appendChild(button);
    }),
  };
  vi.mocked(loadGoogleIdentity).mockResolvedValue(google);
  return google;
};

const renderAt = async (hash: string) => {
  window.location.hash = hash;
  render(
    <Providers>
      <App />
    </Providers>,
  );
  await act(async () => {});
};

afterEach(() => {
  sessionStore.clear();
  localStorage.clear();
  window.location.hash = "";
  vi.unstubAllGlobals();
  mockEnv.googleClientId = "dashboard.apps.googleusercontent.com";
});

describe("Connexion Google du dashboard", () => {
  it("ouvre la session avec l'ID token Google", async () => {
    const google = fakeGoogle();
    const { calls } = mockApi({
      "POST /tenants/google-register": () => [
        200,
        { ...tokens("g"), user: tenant, isSuccess: true },
      ],
    });
    await renderAt("#/login");

    await userEvent.click(await screen.findByRole("button", { name: "Continuer avec Google" }));

    await waitFor(() => expect(window.location.hash).toBe("#/"));
    expect(calls.find(({ route }) => route === "POST /tenants/google-register")?.body).toEqual({
      token: "google-id-token",
    });
    expect(sessionStore.getUser()?.email).toBe(tenant.email);
    expect(google.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: "dashboard.apps.googleusercontent.com" }),
    );
    // Même couleur que le bouton principal : noir en thème clair.
    expect(google.renderButton).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ theme: "filled_black", text: "continue_with" }),
    );
  });

  it("place le bouton Google sous le bouton principal, séparé par « ou »", async () => {
    fakeGoogle();
    mockApi({});
    await renderAt("#/login");

    const google = await screen.findByRole("button", { name: "Continuer avec Google" });
    const submit = screen.getByRole("button", { name: "Continuer" });
    const separator = screen.getByText("ou");
    const follows = (a: Element, b: Element) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(submit, separator) && follows(separator, google)).toBe(true);
  });

  it("propose Google sous « Créer mon compte »", async () => {
    fakeGoogle();
    mockApi({});
    await renderAt("#/register");

    const google = await screen.findByRole("button", { name: "Continuer avec Google" });
    const submit = screen.getByRole("button", { name: "Créer mon compte" });
    expect(submit.compareDocumentPosition(google) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("masque Google à l'étape du code de connexion", async () => {
    fakeGoogle();
    mockApi({ "POST /tenants/login": () => [200, { MFARequired: true, isSuccess: true }] });
    await renderAt("#/login");
    const user = userEvent.setup();

    await screen.findByRole("button", { name: "Continuer avec Google" });
    await user.type(screen.getByLabelText("Adresse e-mail"), "alice@test.com");
    await user.type(screen.getByLabelText("Mot de passe"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Continuer" }));

    expect(await screen.findByLabelText("Code reçu par e-mail")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continuer avec Google" })).not.toBeInTheDocument();
  });

  it("affiche l'erreur de l'API", async () => {
    fakeGoogle();
    mockApi({ "POST /tenants/google-register": () => apiError(401, "invalidGoogleToken") });
    await renderAt("#/login");

    await userEvent.click(await screen.findByRole("button", { name: "Continuer avec Google" }));

    expect(await screen.findByText("La connexion Google a échoué. Réessayez.")).toBeInTheDocument();
    expect(window.location.hash).toBe("#/login");
  });

  it("signale un script Google indisponible sans bloquer la connexion par e-mail", async () => {
    vi.mocked(loadGoogleIdentity).mockRejectedValue(new Error("blocked"));
    mockApi({});
    await renderAt("#/login");

    expect(
      await screen.findByText("La connexion Google est indisponible pour le moment."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Adresse e-mail")).toBeInTheDocument();
  });

  it("n'affiche rien sans Client ID Google configuré", async () => {
    mockEnv.googleClientId = null;
    vi.mocked(loadGoogleIdentity).mockClear();
    mockApi({});
    await renderAt("#/login");

    expect(await screen.findByLabelText("Adresse e-mail")).toBeInTheDocument();
    expect(screen.queryByText("ou")).not.toBeInTheDocument();
    expect(loadGoogleIdentity).not.toHaveBeenCalled();
  });
});
