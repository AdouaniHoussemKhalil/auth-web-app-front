import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "@/App";
import { Providers } from "@/app/providers";
import { sessionStore } from "@/features/auth/sessionStore";
import { apiError, mockApi } from "@/test/mockApi";

const renderApp = async (hash: string) => {
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
});

describe("Mot de passe oublié", () => {
  it("reprend l'e-mail saisi sur l'écran de connexion", async () => {
    mockApi({});
    await renderApp("#/login");
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Adresse e-mail"), "alice@test.com");

    expect(screen.getByRole("link", { name: "Mot de passe oublié ?" })).toHaveAttribute(
      "href",
      "#/forgot-password?email=alice%40test.com",
    );
  });

  it("réinitialise le mot de passe en trois étapes puis revient à la connexion", async () => {
    const { calls } = mockApi({
      "POST /tenants/forgotPassword": () => [201, { isSuccess: true }],
      "POST /tenants/verifyResetCode": () => [201, { resetToken: "reset-token-1" }],
      "PUT /tenants/resetPassword": () => [201, { isSuccess: true }],
    });
    await renderApp("#/forgot-password?email=alice%40test.com");
    const user = userEvent.setup();

    expect(await screen.findByLabelText("Adresse e-mail")).toHaveValue("alice@test.com");
    await user.click(screen.getByRole("button", { name: "Recevoir un code" }));

    await user.type(await screen.findByLabelText("Code reçu par e-mail"), "123456");
    await user.click(screen.getByRole("button", { name: "Valider le code" }));

    await user.type(await screen.findByLabelText("Nouveau mot de passe"), "NewPassword2@");
    await user.type(screen.getByLabelText("Confirmation du mot de passe"), "NewPassword2@");
    await user.click(screen.getByRole("button", { name: "Changer mon mot de passe" }));

    await waitFor(() => expect(window.location.hash).toBe("#/login"));
    expect(calls).toEqual([
      { route: "POST /tenants/forgotPassword", body: { email: "alice@test.com" } },
      {
        route: "POST /tenants/verifyResetCode",
        body: { email: "alice@test.com", resetCode: "123456" },
      },
      {
        route: "PUT /tenants/resetPassword",
        body: {
          email: "alice@test.com",
          resetToken: "reset-token-1",
          password: "NewPassword2@",
          confirmPassword: "NewPassword2@",
        },
      },
    ]);
  });

  it("affiche l'erreur d'un code expiré et permet d'en redemander un", async () => {
    const { calls } = mockApi({
      "POST /tenants/forgotPassword": () => [201, { isSuccess: true }],
      "POST /tenants/verifyResetCode": () => apiError(400, "expiredCode"),
    });
    await renderApp("#/forgot-password");
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Adresse e-mail"), "alice@test.com");
    await user.click(screen.getByRole("button", { name: "Recevoir un code" }));
    await user.type(await screen.findByLabelText("Code reçu par e-mail"), "123456");
    await user.click(screen.getByRole("button", { name: "Valider le code" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ce code a expiré. Demandez-en un nouveau.",
    );
    await user.click(screen.getByRole("button", { name: "Renvoyer un code" }));
    await waitFor(() =>
      expect(calls.filter(({ route }) => route === "POST /tenants/forgotPassword")).toHaveLength(2),
    );
  });

  it("vérifie les règles du nouveau mot de passe avant tout envoi", async () => {
    mockApi({
      "POST /tenants/forgotPassword": () => [201, { isSuccess: true }],
      "POST /tenants/verifyResetCode": () => [201, { resetToken: "t" }],
    });
    await renderApp("#/forgot-password?email=alice%40test.com");
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Recevoir un code" }));
    await user.type(await screen.findByLabelText("Code reçu par e-mail"), "123456");
    await user.click(screen.getByRole("button", { name: "Valider le code" }));
    await user.type(await screen.findByLabelText("Nouveau mot de passe"), "faible");
    await user.click(screen.getByRole("button", { name: "Changer mon mot de passe" }));

    expect(await screen.findByText("8 caractères minimum", { selector: "p" })).toBeInTheDocument();
    expect(window.location.hash).toBe("#/forgot-password?email=alice%40test.com");
  });
});
