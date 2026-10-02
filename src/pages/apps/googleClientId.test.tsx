import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "@/App";
import { Providers } from "@/app/providers";
import { STORAGE_KEY, sessionStore } from "@/features/auth/sessionStore";
import { mockApi, tenant, tokens } from "@/test/mockApi";

const CLIENT_ID = "1234-shop.apps.googleusercontent.com";

const app = (overrides: Record<string, unknown> = {}) => ({
  id: "app-1",
  tenantId: tenant.tenantId,
  name: "Boutique",
  secretKey: "secret",
  isActive: true,
  redirectUrl: "https://boutique.test",
  resetPasswordUrl: "https://boutique.test/reset",
  createdAt: "2026-09-01T10:00:00.000Z",
  ...overrides,
});

const renderDetail = async (googleClientId?: string) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ refreshToken: "refresh-0", user: tenant }));
  const api = mockApi({
    "POST /tenants/refresh": () => [200, tokens("1")],
    "GET /config/apps/tenant-1/app-1": () => [200, app(googleClientId ? { googleClientId } : {})],
    "PUT /config/apps/update/tenant-1/app-1": () => [200, { isSuccess: true }],
  });
  window.location.hash = "#/apps/app-1";
  render(
    <Providers>
      <App />
    </Providers>,
  );
  await act(async () => {});
  return api;
};

afterEach(() => {
  sessionStore.clear();
  localStorage.clear();
  window.location.hash = "";
  vi.unstubAllGlobals();
});

describe("Connexion Google d'une application", () => {
  it("active la connexion Google avec un Client ID", async () => {
    const { calls } = await renderDetail();
    const user = userEvent.setup();

    expect(
      await screen.findByText(/Désactivée\. Renseignez le Client ID Google/),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText("Client ID Google"), CLIENT_ID);
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(
      await screen.findByText(/Les utilisateurs peuvent se connecter avec Google/),
    ).toBeInTheDocument();
    expect(calls.find(({ route }) => route.startsWith("PUT"))?.body).toEqual({
      googleClientId: CLIENT_ID,
    });
  });

  it("refuse une valeur qui n'est pas un Client ID Google", async () => {
    const { calls } = await renderDetail();
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Client ID Google"), "mon-client-id");
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(
      await screen.findByText("Client ID Google attendu : …apps.googleusercontent.com"),
    ).toBeInTheDocument();
    expect(calls.some(({ route }) => route.startsWith("PUT"))).toBe(false);
  });

  it("désactive la connexion Google", async () => {
    const { calls } = await renderDetail(CLIENT_ID);

    expect(await screen.findByLabelText("Client ID Google")).toHaveValue(CLIENT_ID);
    await userEvent.click(screen.getByRole("button", { name: "Désactiver la connexion Google" }));

    await waitFor(() =>
      expect(calls.find(({ route }) => route.startsWith("PUT"))?.body).toEqual({
        googleClientId: null,
      }),
    );
    expect(await screen.findByLabelText("Client ID Google")).toHaveValue("");
    expect(screen.getByText(/Désactivée\. Renseignez le Client ID Google/)).toBeInTheDocument();
  });

  it("se renseigne dès la création de l'application", async () => {
    await renderDetail();
    mockApi({
      "POST /tenants/refresh": () => [200, tokens("1")],
      "POST /config/apps/create": () => [201, { data: { appId: "app-2" }, isSuccess: true }],
      "GET /config/apps/tenant-1/app-2": () => [
        200,
        app({ id: "app-2", googleClientId: CLIENT_ID }),
      ],
    });
    window.location.hash = "#/apps/new";
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Nom"), "Boutique 2");
    await user.type(screen.getByLabelText("URL de redirection"), "https://b2.test");
    await user.type(
      screen.getByLabelText("URL de réinitialisation du mot de passe"),
      "https://b2.test/r",
    );
    await user.type(screen.getByLabelText("E-mail de support"), "s@b2.test");
    await user.type(screen.getByLabelText("Client ID Google"), CLIENT_ID);
    await user.click(screen.getByRole("button", { name: "Créer l'application" }));

    await waitFor(() => expect(window.location.hash).toBe("#/apps/app-2"));
    expect(await screen.findByLabelText("Client ID Google")).toHaveValue(CLIENT_ID);
  });
});
