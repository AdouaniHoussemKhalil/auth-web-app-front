import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "@/App";
import { Providers } from "@/app/providers";
import { STORAGE_KEY, sessionStore } from "@/features/auth/sessionStore";
import { apiError, mockApi, tenant, tokens } from "@/test/mockApi";

const UPDATE = "PUT /config/apps/update/tenant-1/app-1";
const TEST_EMAIL = "POST /config/apps/tenant-1/app-1/test-email";

const app = {
  id: "app-1",
  tenantId: tenant.tenantId,
  name: "Lingutrack",
  secretKey: "secret",
  isActive: true,
  redirectUrl: "https://lingutrack.test",
  resetPasswordUrl: "https://lingutrack.test/reset",
  createdAt: "2026-09-01T10:00:00.000Z",
  branding: {
    appName: "Lingutrack",
    supportEmail: "support@lingutrack.test",
    logoUrl: "https://cdn.lingutrack.test/logo.png",
    primaryColor: "#2563ebff",
  },
};

const renderDetail = async (routes: Parameters<typeof mockApi>[0] = {}) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ refreshToken: "refresh-0", user: tenant }));
  const api = mockApi({
    "POST /tenants/refresh": () => [200, tokens("1")],
    "GET /config/apps/tenant-1/app-1": () => [200, app],
    [UPDATE]: () => [200, { isSuccess: true }],
    [TEST_EMAIL]: () => [200, { data: { to: tenant.email }, isSuccess: true }],
    ...routes,
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

describe("Apparence des e-mails d'une application", () => {
  it("affiche les valeurs actuelles et un aperçu", async () => {
    await renderDetail();

    expect(await screen.findByLabelText("Nom affiché")).toHaveValue("Lingutrack");
    expect(screen.getByLabelText("E-mail de support")).toHaveValue("support@lingutrack.test");
    expect(screen.getByLabelText("URL du logo")).toHaveValue(
      "https://cdn.lingutrack.test/logo.png",
    );
    // Ancienne valeur #RRGGBBAA ramenée à #RRGGBB.
    expect(screen.getByLabelText("Couleur principale")).toHaveValue("#2563eb");
    const preview = screen.getByRole("img", { name: "Aperçu de l'e-mail" });
    expect(within(preview).getByText("123456")).toBeInTheDocument();
  });

  it("enregistre les modifications ; un champ vidé revient à la valeur par défaut", async () => {
    const { calls } = await renderDetail();
    const user = userEvent.setup();

    const name = await screen.findByLabelText("Nom affiché");
    await user.clear(name);
    await user.type(name, "Lingutrack Pro");
    await user.clear(screen.getByLabelText("URL du logo"));
    await user.clear(screen.getByLabelText("Couleur principale"));
    await user.type(screen.getByLabelText("Couleur principale"), "#16a34a");
    await user.click(screen.getByRole("button", { name: "Enregistrer l'apparence" }));

    await waitFor(() =>
      expect(calls.find(({ route }) => route === UPDATE)?.body).toEqual({
        name: "Lingutrack Pro",
        supportEmail: "support@lingutrack.test",
        logoUrl: null,
        primaryColor: "#16a34a",
      }),
    );
    expect(await screen.findByRole("heading", { name: "Lingutrack Pro" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enregistrer l'apparence" })).toBeDisabled();
  });

  it("valide les champs avant l'envoi", async () => {
    const { calls } = await renderDetail();
    const user = userEvent.setup();

    const color = await screen.findByLabelText("Couleur principale");
    await user.clear(color);
    await user.type(color, "bleu");
    await user.click(screen.getByRole("button", { name: "Enregistrer l'apparence" }));

    expect(await screen.findByText("Couleur hexadécimale (#2563eb)")).toBeInTheDocument();
    expect(calls.some(({ route }) => route === UPDATE)).toBe(false);
  });

  it("envoie un e-mail de test au tenant", async () => {
    const { calls } = await renderDetail();

    await userEvent.click(await screen.findByRole("button", { name: "Envoyer un e-mail de test" }));

    expect(await screen.findByText(`E-mail de test envoyé à ${tenant.email}`)).toBeInTheDocument();
    expect(calls.some(({ route }) => route === TEST_EMAIL)).toBe(true);
  });

  it("demande d'enregistrer avant l'e-mail de test", async () => {
    await renderDetail();
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Nom affiché"), " 2");

    expect(screen.getByRole("button", { name: "Envoyer un e-mail de test" })).toBeDisabled();
    expect(screen.getByText("Enregistrez avant d'envoyer un e-mail de test.")).toBeInTheDocument();
  });

  it("affiche l'erreur si l'e-mail de test échoue", async () => {
    await renderDetail({ [TEST_EMAIL]: () => apiError(429, "tooManyRequests") });

    await userEvent.click(await screen.findByRole("button", { name: "Envoyer un e-mail de test" }));

    expect(
      await screen.findByText("Trop de tentatives. Réessayez dans quelques minutes."),
    ).toBeInTheDocument();
  });
});
