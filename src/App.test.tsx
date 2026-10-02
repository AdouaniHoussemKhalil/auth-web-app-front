import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "@/App";
import { Providers } from "@/app/providers";
import { STORAGE_KEY, sessionStore } from "@/features/auth/sessionStore";
import { apiError, mockApi, tenant, tokens } from "@/test/mockApi";

const renderApp = async (hash: string) => {
  window.location.hash = hash;
  render(
    <Providers>
      <App />
    </Providers>,
  );
  // Laisse la restauration de session se terminer.
  await act(async () => {});
};

const currentHash = () => window.location.hash;

afterEach(() => {
  sessionStore.clear();
  localStorage.clear();
  window.location.hash = "";
  vi.unstubAllGlobals();
});

describe("Accès aux pages", () => {
  it("redirige un visiteur non connecté vers la connexion", async () => {
    mockApi({});
    await renderApp("#/");

    await waitFor(() => expect(currentHash()).toBe("#/login"));
  });

  it("restaure une session enregistrée au démarrage", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ refreshToken: "refresh-0", user: tenant }));
    const { calls } = mockApi({ "POST /tenants/refresh": () => [200, tokens("2")] });

    await renderApp("#/");

    expect(await screen.findByRole("heading", { name: "Tableau de bord" })).toBeInTheDocument();
    expect(calls[0]).toEqual({
      route: "POST /tenants/refresh",
      body: { refreshToken: "refresh-0" },
    });
  });
});

describe("Connexion en deux étapes", () => {
  it("demande le code MFA puis ouvre la session", async () => {
    const { calls } = mockApi({
      "POST /tenants/login": () => [200, { MFARequired: true }],
      "POST /tenants/loginByMFACode": () => [200, { result: tenant, ...tokens() }],
    });
    await renderApp("#/login");
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Adresse e-mail"), "alice@test.com");
    await user.type(screen.getByLabelText("Mot de passe"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Continuer" }));

    await user.type(await screen.findByLabelText("Code reçu par e-mail"), "123456");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() => expect(currentHash()).toBe("#/"));
    expect(await screen.findByRole("button", { name: /Menu de Alice Martin/ })).toBeInTheDocument();
    expect(calls.map(({ route }) => route)).toEqual([
      "POST /tenants/login",
      "POST /tenants/loginByMFACode",
    ]);
    expect(calls[1].body).toEqual({ email: "alice@test.com", mfaCode: "123456" });
  });

  it("affiche l'erreur de l'API en français", async () => {
    mockApi({ "POST /tenants/login": () => apiError(401, "invalidCredentials") });
    await renderApp("#/login");
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Adresse e-mail"), "alice@test.com");
    await user.type(screen.getByLabelText("Mot de passe"), "wrong");
    await user.click(screen.getByRole("button", { name: "Continuer" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou mot de passe incorrect.");
  });

  it("propose de vérifier l'adresse si elle ne l'est pas encore", async () => {
    mockApi({ "POST /tenants/login": () => apiError(403, "emailNotVerified") });
    await renderApp("#/login");
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Adresse e-mail"), "alice@test.com");
    await user.type(screen.getByLabelText("Mot de passe"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Continuer" }));

    expect(await screen.findByRole("link", { name: "Vérifier mon adresse" })).toHaveAttribute(
      "href",
      "#/verify-email?email=alice%40test.com",
    );
  });
});

describe("Inscription et vérification de l'e-mail", () => {
  it("inscrit le tenant puis ouvre la session avec le code reçu", async () => {
    mockApi({
      "POST /tenants/register": () => [
        201,
        { email: "alice@test.com", emailVerificationRequired: true },
      ],
      "POST /tenants/verifyEmail": () => [200, { user: tenant, ...tokens() }],
    });
    await renderApp("#/register");
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Prénom"), "Alice");
    await user.type(screen.getByLabelText("Nom"), "Martin");
    await user.type(screen.getByLabelText("Adresse e-mail"), "alice@test.com");
    await user.type(screen.getByLabelText("Mot de passe"), "Password1!");
    await user.type(screen.getByLabelText("Confirmation du mot de passe"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Créer mon compte" }));

    await waitFor(() => expect(currentHash()).toBe("#/verify-email?email=alice%40test.com"));

    await user.type(await screen.findByLabelText("Code reçu par e-mail"), "654321");
    await user.click(screen.getByRole("button", { name: "Vérifier mon adresse" }));

    await waitFor(() => expect(currentHash()).toBe("#/"));
    expect(sessionStore.getAccessToken()).toBe("access-1");
  });

  it("n'envoie rien tant que le formulaire est invalide", async () => {
    const { calls } = mockApi({});
    await renderApp("#/register");
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Créer mon compte" }));

    // Erreurs de champ affichées ; la confirmation n'est comparée qu'une fois les champs valides.
    expect(await screen.findAllByText("3 caractères minimum")).toHaveLength(2);
    expect(screen.getByText("8 caractères minimum", { selector: "p" })).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });
});
