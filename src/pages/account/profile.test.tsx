import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "@/App";
import { Providers } from "@/app/providers";
import { STORAGE_KEY, sessionStore } from "@/features/auth/sessionStore";
import { apiError, mockApi, tenant, tokens } from "@/test/mockApi";

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

describe("Profil", () => {
  it("s'ouvre depuis le menu utilisateur", async () => {
    await renderLoggedIn("#/", {});
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: /Menu de Alice Martin/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Mon profil" }));

    await waitFor(() => expect(window.location.hash).toBe("#/profile"));
  });

  it("enregistre le prénom et le nom puis met à jour le menu sans reconnexion", async () => {
    const { calls } = await renderLoggedIn("#/profile", {
      "PUT /tenants/tenant-1": () => [
        200,
        { user: { ...tenant, firstName: "Alicia", lastName: "Durand" }, isSuccess: true },
      ],
    });
    const user = userEvent.setup();

    const firstName = await screen.findByLabelText("Prénom");
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
    expect(screen.getByLabelText("Adresse e-mail")).toHaveValue("alice@test.com");

    await user.clear(firstName);
    await user.type(firstName, "Alicia");
    await user.clear(screen.getByLabelText("Nom"));
    await user.type(screen.getByLabelText("Nom"), "Durand");
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(
      await screen.findByRole("button", { name: /Menu de Alicia Durand/ }),
    ).toBeInTheDocument();
    expect(calls.find(({ route }) => route === "PUT /tenants/tenant-1")?.body).toEqual({
      firstName: "Alicia",
      lastName: "Durand",
    });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}").user.firstName).toBe("Alicia");
  });

  it("valide les champs avant l'envoi", async () => {
    const { calls } = await renderLoggedIn("#/profile", {});
    const user = userEvent.setup();

    await user.clear(await screen.findByLabelText("Prénom"));
    await user.type(screen.getByLabelText("Prénom"), "Al");
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(await screen.findByText("3 caractères minimum")).toBeInTheDocument();
    expect(calls.some(({ route }) => route.startsWith("PUT"))).toBe(false);
  });

  it("affiche l'erreur de l'API", async () => {
    await renderLoggedIn("#/profile", {
      "PUT /tenants/tenant-1": () => apiError(429, "tooManyRequests"),
    });
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Nom"), "x");
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Trop de tentatives");
  });
});
