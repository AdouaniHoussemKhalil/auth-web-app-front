import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "@/App";
import { Providers } from "@/app/providers";
import { STORAGE_KEY, sessionStore } from "@/features/auth/sessionStore";
import { apiError, mockApi, tenant, tokens } from "@/test/mockApi";

const app = (overrides: Record<string, unknown> = {}) => ({
  id: "app-1",
  tenantId: tenant.tenantId,
  name: "Boutique",
  secretKey: "super-secret-value",
  isActive: true,
  redirectUrl: "https://boutique.test",
  resetPasswordUrl: "https://boutique.test/reset",
  tokenExpiresIn: "1h",
  refreshTokenExpiresIn: "7d",
  requireEmailVerification: false,
  mfaSettings: { verificationMode: "code", expiryMinutes: 15 },
  branding: { appName: "Boutique", supportEmail: "support@boutique.test" },
  createdAt: "2026-09-01T10:00:00.000Z",
  ...overrides,
});

const page = (items: unknown[], total = items.length) =>
  [200, { data: items, page: 1, limit: 10, total, isSuccess: true }] as [number, unknown];

/** Démarre l'application avec une session enregistrée (restaurée par un refresh simulé). */
const renderLoggedIn = async (hash: string, routes: Parameters<typeof mockApi>[0]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ refreshToken: "refresh-0", user: tenant }));
  const api = mockApi({ "POST /tenants/refresh": () => [200, tokens("1")], ...routes });
  window.location.hash = hash;
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

describe("Liste des applications", () => {
  it("affiche les applications du tenant sans leur secret", async () => {
    const { calls } = await renderLoggedIn("#/apps", {
      "GET /config/apps/tenant-1": () => page([app()]),
    });

    expect(await screen.findByRole("link", { name: "Boutique" })).toHaveAttribute(
      "href",
      "#/apps/app-1",
    );
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.queryByText("super-secret-value")).not.toBeInTheDocument();
    expect(calls.find(({ route }) => route.startsWith("GET"))?.route).toBe(
      "GET /config/apps/tenant-1",
    );
  });

  it("propose de créer une première application quand la liste est vide", async () => {
    await renderLoggedIn("#/apps", { "GET /config/apps/tenant-1": () => page([]) });

    expect(await screen.findByText("Aucune application")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Nouvelle application" })).toHaveLength(2);
  });

  it("affiche l'erreur et permet de réessayer", async () => {
    let attempts = 0;
    await renderLoggedIn("#/apps", {
      "GET /config/apps/tenant-1": () =>
        ++attempts === 1 ? apiError(500, "internalError") : page([app()]),
    });

    await userEvent.click(await screen.findByRole("button", { name: "Réessayer" }));

    expect(await screen.findByRole("link", { name: "Boutique" })).toBeInTheDocument();
  });

  it("pagine et garde la page dans l'URL", async () => {
    const apps = Array.from({ length: 10 }, (_, index) =>
      app({ id: `app-${index}`, name: `App ${index}` }),
    );
    await renderLoggedIn("#/apps", { "GET /config/apps/tenant-1": () => page(apps, 25) });

    await userEvent.click(await screen.findByRole("button", { name: "Page suivante" }));

    await waitFor(() => expect(window.location.hash).toBe("#/apps?page=2"));
  });
});

describe("Création d'une application", () => {
  it("valide le formulaire puis ouvre la page de la nouvelle application", async () => {
    const { calls } = await renderLoggedIn("#/apps/new", {
      "POST /config/apps/create": () => [201, { isSuccess: true, data: { appId: "app-9" } }],
      "GET /config/apps/tenant-1/app-9": () => [200, app({ id: "app-9", name: "Nouvelle" })],
    });
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Créer l'application" }));
    expect(await screen.findAllByText("URL invalide (https://…)")).not.toHaveLength(0);
    expect(calls.some(({ route }) => route === "POST /config/apps/create")).toBe(false);

    await user.type(screen.getByLabelText("Nom"), "Nouvelle");
    await user.type(screen.getByLabelText("URL de redirection"), "https://nouvelle.test");
    await user.type(
      screen.getByLabelText("URL de réinitialisation du mot de passe"),
      "https://nouvelle.test/reset",
    );
    await user.type(screen.getByLabelText("E-mail de support"), "support@nouvelle.test");
    await user.click(screen.getByRole("button", { name: "Créer l'application" }));

    await waitFor(() => expect(window.location.hash).toBe("#/apps/app-9"));
    const created = calls.find(({ route }) => route === "POST /config/apps/create");
    expect(created?.body).toEqual({
      tenantId: "tenant-1",
      name: "Nouvelle",
      redirectUrl: "https://nouvelle.test",
      resetPasswordUrl: "https://nouvelle.test/reset",
      supportEmail: "support@nouvelle.test",
      tokenExpiresIn: "1h",
      refreshTokenExpiresIn: "7d",
      mfaVerificationMode: "code",
      mfaExpiresIn: "15m",
      requireEmailVerification: false,
    });
  });
});

describe("Détail d'une application", () => {
  it("masque le secret par défaut et l'affiche à la demande", async () => {
    await renderLoggedIn("#/apps/app-1", { "GET /config/apps/tenant-1/app-1": () => [200, app()] });

    expect(await screen.findByRole("heading", { name: "Boutique" })).toBeInTheDocument();
    expect(screen.getByText("app-1")).toBeInTheDocument();
    expect(screen.queryByText("super-secret-value")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Afficher" }));

    expect(screen.getByText("super-secret-value")).toBeInTheDocument();
  });

  it("régénère le secret après confirmation", async () => {
    const { calls } = await renderLoggedIn("#/apps/app-1", {
      "GET /config/apps/tenant-1/app-1": () => [200, app()],
      "POST /config/apps/tenant-1/app-1/rotate-secret": () => [
        200,
        { data: { appId: "app-1", secretKey: "new-secret-value" }, isSuccess: true },
      ],
    });
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Régénérer le secret" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Régénérer" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Afficher" }));
    expect(screen.getByText("new-secret-value")).toBeInTheDocument();
    expect(calls.some(({ route }) => route.endsWith("/rotate-secret"))).toBe(true);
  });

  it("désactive l'application", async () => {
    const { calls } = await renderLoggedIn("#/apps/app-1", {
      "GET /config/apps/tenant-1/app-1": () => [200, app()],
      "PUT /config/apps/update/tenant-1/app-1": () => [200, { isSuccess: true }],
    });

    await userEvent.click(await screen.findByRole("switch", { name: "Application active" }));

    expect(await screen.findByText("Désactivée")).toBeInTheDocument();
    expect(calls.find(({ route }) => route.startsWith("PUT"))?.body).toEqual({ isActive: false });
  });
});
