import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "@/App";
import { Providers } from "@/app/providers";
import { STORAGE_KEY, sessionStore } from "@/features/auth/sessionStore";
import { apiError, mockApi, tenant, tokens } from "@/test/mockApi";

const USERS = "/tenants/tenant-1/app/app-1/consumers";

const consumer = (overrides: Record<string, unknown> = {}) => ({
  id: "c-1",
  firstName: "Bob",
  lastName: "Durand",
  email: "bob@boutique.test",
  isActive: true,
  isEmailVerified: true,
  isMFAActivated: false,
  isByGoogle: false,
  createdOn: "2026-09-10T10:00:00.000Z",
  ...overrides,
});

const page = (items: unknown[], total = items.length) =>
  [200, { data: items, page: 1, limit: 20, total, isSuccess: true }] as [number, unknown];

const app = { id: "app-1", tenantId: "tenant-1", name: "Boutique", secretKey: "s", isActive: true };

const renderLoggedIn = async (hash: string, routes: Parameters<typeof mockApi>[0]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ refreshToken: "refresh-0", user: tenant }));
  const api = mockApi({
    "POST /tenants/refresh": () => [200, tokens("1")],
    "GET /config/apps/tenant-1/app-1": () => [
      200,
      {
        ...app,
        redirectUrl: "https://b.test",
        resetPasswordUrl: "https://b.test/r",
        createdAt: "2026-09-01T10:00:00.000Z",
      },
    ],
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

const openActions = async (email: string) => {
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: `Actions pour ${email}` }));
  return user;
};

afterEach(() => {
  sessionStore.clear();
  localStorage.clear();
  window.location.hash = "";
  vi.unstubAllGlobals();
});

describe("Utilisateurs d'une application", () => {
  it("est accessible depuis la page de l'application", async () => {
    await renderLoggedIn("#/apps/app-1", { [`GET ${USERS}`]: () => page([consumer()]) });

    await userEvent.click(await screen.findByRole("button", { name: "Gérer les utilisateurs" }));

    expect(await screen.findByRole("heading", { name: "Utilisateurs" })).toBeInTheDocument();
    expect(window.location.hash).toBe("#/apps/app-1/users");
  });

  it("liste les utilisateurs avec leur statut et leur compte", async () => {
    await renderLoggedIn("#/apps/app-1/users", {
      [`GET ${USERS}`]: () =>
        page([
          consumer(),
          consumer({
            id: "c-2",
            email: "gina@gmail.com",
            isActive: false,
            isByGoogle: true,
            isMFAActivated: true,
          }),
          consumer({ id: "c-3", email: "new@boutique.test", isEmailVerified: false }),
        ]),
    });

    const rows = await screen.findAllByRole("row");
    expect(within(rows[1]).getByText("bob@boutique.test")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Actif")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Bloqué")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Google")).toBeInTheDocument();
    expect(within(rows[2]).getByText("MFA")).toBeInTheDocument();
    expect(within(rows[3]).getByText("E-mail non vérifié")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "← Boutique" })).toBeInTheDocument();
  });

  it("recherche par e-mail et garde la recherche dans l'URL", async () => {
    // La liste n'est vide que si l'API reçoit bien le filtre `email`.
    await renderLoggedIn("#/apps/app-1/users", {
      [`GET ${USERS}`]: (_, query) =>
        query.get("email") === "gina" ? page([]) : page([consumer()]),
    });

    await userEvent.type(
      await screen.findByRole("searchbox", { name: "Rechercher par e-mail" }),
      "gina",
    );

    expect(await screen.findByText("Aucun résultat")).toBeInTheDocument();
    expect(window.location.hash).toBe("#/apps/app-1/users?q=gina");
  });

  it("invite à brancher l'application quand il n'y a aucun utilisateur", async () => {
    await renderLoggedIn("#/apps/app-1/users", { [`GET ${USERS}`]: () => page([]) });

    expect(await screen.findByText("Aucun utilisateur")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Voir comment brancher l'application" }),
    ).toHaveAttribute("href", "#/docs");
  });

  it("pagine et garde la page dans l'URL", async () => {
    const requestedPages: (string | null)[] = [];
    await renderLoggedIn("#/apps/app-1/users", {
      [`GET ${USERS}`]: (_, query) => {
        requestedPages.push(query.get("page"));
        return page([consumer()], 45);
      },
    });

    await userEvent.click(await screen.findByRole("button", { name: "Page suivante" }));

    await waitFor(() => expect(window.location.hash).toBe("#/apps/app-1/users?page=2"));
    await waitFor(() => expect(requestedPages.at(-1)).toBe("2"));
  });

  it("affiche le détail d'un utilisateur", async () => {
    await renderLoggedIn("#/apps/app-1/users", {
      [`GET ${USERS}`]: () => page([consumer({ isByGoogle: true })]),
    });

    const user = await openActions("bob@boutique.test");
    await user.click(await screen.findByRole("menuitem", { name: "Voir le détail" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Bob Durand" })).toBeInTheDocument();
    expect(within(dialog).getByText("Google")).toBeInTheDocument();
    expect(within(dialog).getByText("c-1")).toBeInTheDocument();
  });

  it("bloque un utilisateur après confirmation", async () => {
    const { calls } = await renderLoggedIn("#/apps/app-1/users", {
      [`GET ${USERS}`]: () => page([consumer()]),
      [`PATCH ${USERS}/c-1`]: () => [200, { data: consumer({ isActive: false }), isSuccess: true }],
    });

    const user = await openActions("bob@boutique.test");
    await user.click(await screen.findByRole("menuitem", { name: "Bloquer" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/déconnecté de tous ses appareils/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Bloquer" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(await screen.findByText("Bloqué")).toBeInTheDocument();
    expect(calls.find(({ route }) => route.startsWith("PATCH"))?.body).toEqual({ isActive: false });
  });

  it("débloque un utilisateur directement", async () => {
    const { calls } = await renderLoggedIn("#/apps/app-1/users", {
      [`GET ${USERS}`]: () => page([consumer({ isActive: false })]),
      [`PATCH ${USERS}/c-1`]: () => [200, { data: consumer(), isSuccess: true }],
    });

    const user = await openActions("bob@boutique.test");
    await user.click(await screen.findByRole("menuitem", { name: "Débloquer" }));

    expect(await screen.findByText("Actif")).toBeInTheDocument();
    expect(calls.find(({ route }) => route.startsWith("PATCH"))?.body).toEqual({ isActive: true });
  });

  it("supprime un utilisateur après confirmation puis recharge la liste", async () => {
    let deleted = false;
    await renderLoggedIn("#/apps/app-1/users", {
      [`GET ${USERS}`]: () => (deleted ? page([]) : page([consumer()])),
      [`DELETE ${USERS}/c-1`]: () => {
        deleted = true;
        return [200, { isSuccess: true }];
      },
    });

    const user = await openActions("bob@boutique.test");
    await user.click(await screen.findByRole("menuitem", { name: "Supprimer" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Supprimer" }));

    expect(await screen.findByText("Aucun utilisateur")).toBeInTheDocument();
  });

  it("garde la fenêtre ouverte et affiche l'erreur si l'action échoue", async () => {
    await renderLoggedIn("#/apps/app-1/users", {
      [`GET ${USERS}`]: () => page([consumer()]),
      [`DELETE ${USERS}/c-1`]: () => apiError(403, "insufficientScope"),
    });

    const user = await openActions("bob@boutique.test");
    await user.click(await screen.findByRole("menuitem", { name: "Supprimer" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Supprimer" }));

    expect(await within(dialog).findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
