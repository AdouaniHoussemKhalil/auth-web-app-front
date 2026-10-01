import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "@/App";
import { Providers } from "@/app/providers";
import { STORAGE_KEY, sessionStore } from "@/features/auth/sessionStore";
import { apiError, mockApi, tenant, tokens } from "@/test/mockApi";

const UPDATE = "PUT /config/apps/update/tenant-1/app-1";

const app = (overrides: Record<string, unknown> = {}) => ({
  id: "app-1",
  tenantId: tenant.tenantId,
  name: "Lingutrack",
  secretKey: "secret",
  isActive: true,
  redirectUrl: "https://lingutrack.test",
  resetPasswordUrl: "https://lingutrack.test/reset-password",
  logoutUrl: "https://lingutrack.test/logout",
  requireEmailVerification: false,
  mfaSettings: { verificationMode: "code", expiryMinutes: 15 },
  branding: { appName: "Lingutrack", supportEmail: "support@lingutrack.test" },
  createdAt: "2026-09-01T10:00:00.000Z",
  ...overrides,
});

const renderAt = async (hash: string, routes: Parameters<typeof mockApi>[0] = {}) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ refreshToken: "refresh-0", user: tenant }));
  const api = mockApi({
    "POST /tenants/refresh": () => [200, tokens("1")],
    "GET /config/apps/tenant-1/app-1": () => [200, app()],
    [UPDATE]: () => [200, { isSuccess: true }],
    ...routes,
  });
  window.location.hash = hash;
  render(
    <Providers>
      <App />
    </Providers>,
  );
  await act(async () => {});
  return api;
};

/** Ouvre un select (par son libellé) et choisit une option. */
const choose = async (user: ReturnType<typeof userEvent.setup>, label: string, option: string) => {
  await user.click(await screen.findByRole("combobox", { name: label }));
  await user.click(await screen.findByRole("option", { name: option }));
};

afterEach(() => {
  sessionStore.clear();
  localStorage.clear();
  window.location.hash = "";
  vi.unstubAllGlobals();
});

describe("URLs et vérification d'une application", () => {
  it("passe la vérification d'e-mail en lien, avec ses pages de succès et d'échec", async () => {
    const { calls } = await renderAt("#/apps/app-1");
    const user = userEvent.setup();

    expect(await screen.findByLabelText("URL de réinitialisation")).toHaveValue(
      "https://lingutrack.test/reset-password",
    );
    expect(screen.queryByLabelText("Page « adresse confirmée »")).not.toBeInTheDocument();

    await choose(user, "Vérification de l'e-mail", "Lien de confirmation par e-mail");
    await choose(user, "Mot de passe oublié", "Lien vers votre page de réinitialisation");
    await user.click(screen.getByRole("button", { name: "Enregistrer les réglages" }));

    // Pages obligatoires en mode lien : rien n'est envoyé.
    expect(await screen.findAllByText("Obligatoire avec le lien de confirmation")).toHaveLength(2);
    expect(calls.some(({ route }) => route === UPDATE)).toBe(false);

    await user.type(
      screen.getByLabelText("Page « adresse confirmée »"),
      "https://lingutrack.test/email-verified",
    );
    await user.type(
      screen.getByLabelText("Page « lien invalide »"),
      "https://lingutrack.test/email-error",
    );
    await user.click(screen.getByRole("button", { name: "Enregistrer les réglages" }));

    await waitFor(() =>
      expect(calls.find(({ route }) => route === UPDATE)?.body).toEqual({
        redirectUrl: "https://lingutrack.test",
        resetPasswordUrl: "https://lingutrack.test/reset-password",
        logoutUrl: "https://lingutrack.test/logout",
        emailVerifiedUrl: "https://lingutrack.test/email-verified",
        emailVerificationFailedUrl: "https://lingutrack.test/email-error",
        emailVerificationMode: "link",
        passwordResetMode: "link",
        mfaVerificationMode: "code",
        requireEmailVerification: false,
      }),
    );
    expect(await screen.findByText("Réglages enregistrés")).toBeInTheDocument();
  });

  it("retire une URL optionnelle vidée", async () => {
    const { calls } = await renderAt("#/apps/app-1");
    const user = userEvent.setup();

    await user.clear(await screen.findByLabelText("URL de déconnexion (optionnel)"));
    await user.click(screen.getByRole("button", { name: "Enregistrer les réglages" }));

    await waitFor(() =>
      expect(calls.find(({ route }) => route === UPDATE)?.body).toMatchObject({
        logoutUrl: null,
        emailVerifiedUrl: null,
      }),
    );
  });

  it("affiche l'erreur de l'API", async () => {
    await renderAt("#/apps/app-1", { [UPDATE]: () => apiError(400, "verificationUrlsRequired") });
    const user = userEvent.setup();

    await user.clear(await screen.findByLabelText("URL de déconnexion (optionnel)"));
    await user.click(screen.getByRole("button", { name: "Enregistrer les réglages" }));

    expect(
      await screen.findByText(
        "Le lien de confirmation exige une page « adresse confirmée » et une page « lien invalide ».",
      ),
    ).toBeInTheDocument();
  });

  it("propose le mode lien dès la création", async () => {
    const { calls } = await renderAt("#/apps/new", {
      "POST /config/apps/create": () => [201, { data: { appId: "app-1" }, isSuccess: true }],
    });
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Nom"), "Lingutrack");
    await user.type(screen.getByLabelText("URL de redirection"), "https://lingutrack.test");
    await user.type(
      screen.getByLabelText("URL de réinitialisation du mot de passe"),
      "https://lingutrack.test/reset-password",
    );
    await user.type(screen.getByLabelText("E-mail de support"), "support@lingutrack.test");
    await choose(user, "Vérification de l'e-mail", "Lien de confirmation par e-mail");
    await user.type(
      screen.getByLabelText("Page « adresse confirmée »"),
      "https://lingutrack.test/ok",
    );
    await user.type(screen.getByLabelText("Page « lien invalide »"), "https://lingutrack.test/ko");
    await user.click(screen.getByRole("button", { name: "Créer l'application" }));

    await waitFor(() =>
      expect(calls.find(({ route }) => route === "POST /config/apps/create")?.body).toMatchObject({
        emailVerificationMode: "link",
        passwordResetMode: "code",
        emailVerifiedUrl: "https://lingutrack.test/ok",
        emailVerificationFailedUrl: "https://lingutrack.test/ko",
      }),
    );
  });
});
