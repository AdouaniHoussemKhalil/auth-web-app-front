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
      button.textContent =
        options.text === "signup_with" ? "S'inscrire avec Google" : "Se connecter avec Google";
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

    await userEvent.click(await screen.findByRole("button", { name: "Se connecter avec Google" }));

    await waitFor(() => expect(window.location.hash).toBe("#/"));
    expect(calls.find(({ route }) => route === "POST /tenants/google-register")?.body).toEqual({
      token: "google-id-token",
    });
    expect(sessionStore.getUser()?.email).toBe(tenant.email);
    expect(google.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: "dashboard.apps.googleusercontent.com" }),
    );
  });

  it("propose l'inscription avec Google", async () => {
    fakeGoogle();
    mockApi({});
    await renderAt("#/register");

    expect(
      await screen.findByRole("button", { name: "S'inscrire avec Google" }),
    ).toBeInTheDocument();
    expect(screen.getByText("ou")).toBeInTheDocument();
  });

  it("affiche l'erreur de l'API", async () => {
    fakeGoogle();
    mockApi({ "POST /tenants/google-register": () => apiError(401, "invalidGoogleToken") });
    await renderAt("#/login");

    await userEvent.click(await screen.findByRole("button", { name: "Se connecter avec Google" }));

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
