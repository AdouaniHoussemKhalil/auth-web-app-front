// Vérifie que l'exemple React publié dans la documentation fonctionne tel qu'il est affiché.
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GoogleButton } from "./GoogleButton";
import { fetchProfile, LoginPage } from "./LoginPage";

const respond = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

afterEach(() => vi.unstubAllGlobals());

describe("Exemple React de la documentation", () => {
  it("se connecte en deux étapes quand le MFA est actif", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(respond(200, { MFARequired: true }))
      .mockResolvedValueOnce(respond(200, { access_token: "a", refresh_token: "r" }));
    vi.stubGlobal("fetch", fetchMock);
    const onLoggedIn = vi.fn();
    const user = userEvent.setup();
    render(<LoginPage onLoggedIn={onLoggedIn} />);

    await user.type(screen.getByLabelText("E-mail"), "bob@test.com");
    await user.type(screen.getByLabelText("Mot de passe"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));
    await user.type(await screen.findByLabelText("Code reçu par e-mail"), "123456");
    await user.click(screen.getByRole("button", { name: "Valider le code" }));

    await waitFor(() =>
      expect(onLoggedIn).toHaveBeenCalledWith({ accessToken: "a", refreshToken: "r" }),
    );
    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual(["/auth/login", "/auth/login/mfa"]);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      email: "bob@test.com",
      mfaCode: "123456",
    });
  });

  it("affiche le message d'erreur de l'API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        respond(401, {
          error: { code: "invalidCredentials", message: "Invalid email or password" },
        }),
      ),
    );
    const user = userEvent.setup();
    render(<LoginPage onLoggedIn={vi.fn()} />);

    await user.type(screen.getByLabelText("E-mail"), "bob@test.com");
    await user.type(screen.getByLabelText("Mot de passe"), "wrong");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
  });

  it("appelle une route protégée avec le token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respond(200, { email: "bob@test.com" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchProfile({ accessToken: "a", refreshToken: "r" })).resolves.toEqual({
      email: "bob@test.com",
    });
    expect(fetchMock.mock.calls[0][1].headers).toEqual({ Authorization: "Bearer a" });
  });
});

describe("Exemple du bouton Google de la documentation", () => {
  // Faux script Google : garde le callback et affiche un bouton qui le déclenche.
  const credential = `h.${btoa(JSON.stringify({ email: "gina@gmail.com" })).replace(/=+$/, "")}.s`;
  const installGoogle = () => {
    const initialize = vi.fn();
    vi.stubGlobal("google", {
      accounts: {
        id: {
          initialize,
          renderButton: (parent: HTMLElement) => {
            const button = document.createElement("button");
            button.textContent = "Continuer avec Google";
            button.onclick = () => initialize.mock.calls[0][0].callback({ credential });
            parent.appendChild(button);
          },
        },
      },
    });
    return initialize;
  };

  it("échange l'ID token Google contre une session via le back", async () => {
    const initialize = installGoogle();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(respond(201, { access_token: "a", refresh_token: "r", isNewUser: true }));
    vi.stubGlobal("fetch", fetchMock);
    const onLoggedIn = vi.fn();
    render(
      <GoogleButton
        clientId="id.apps.googleusercontent.com"
        onLoggedIn={onLoggedIn}
        onMfaRequired={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Continuer avec Google" }));

    await waitFor(() =>
      expect(onLoggedIn).toHaveBeenCalledWith({ accessToken: "a", refreshToken: "r" }),
    );
    expect(initialize.mock.calls[0][0].client_id).toBe("id.apps.googleusercontent.com");
    expect(fetchMock.mock.calls[0][0]).toBe("/auth/google");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ token: credential });
  });

  it("passe à l'étape du code quand le MFA est actif", async () => {
    installGoogle();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respond(200, { MFARequired: true })));
    const onMfaRequired = vi.fn();
    render(<GoogleButton clientId="id" onLoggedIn={vi.fn()} onMfaRequired={onMfaRequired} />);

    await userEvent.click(screen.getByRole("button", { name: "Continuer avec Google" }));

    await waitFor(() => expect(onMfaRequired).toHaveBeenCalledWith("gina@gmail.com"));
  });

  it("affiche l'erreur de l'API", async () => {
    installGoogle();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        respond(400, {
          error: { code: "googleSignInDisabled", message: "Google sign-in is not configured" },
        }),
      ),
    );
    render(<GoogleButton clientId="id" onLoggedIn={vi.fn()} onMfaRequired={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Continuer avec Google" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Google sign-in is not configured");
  });
});
