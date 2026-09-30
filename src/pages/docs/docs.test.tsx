import { act, render, screen, within } from "@testing-library/react";
import { App } from "@/App";
import { Providers } from "@/app/providers";
import { STORAGE_KEY, sessionStore } from "@/features/auth/sessionStore";
import { mockApi, tenant, tokens } from "@/test/mockApi";

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

describe("Documentation « Comment commencer »", () => {
  it("est lisible sans être connecté, avec les exemples de code vérifiés", async () => {
    mockApi({});
    await renderApp("#/docs");

    expect(await screen.findByRole("heading", { name: "Comment commencer" })).toBeInTheDocument();
    expect(window.location.hash).toBe("#/docs");
    expect(screen.getByRole("link", { name: "Créer un compte" })).toHaveAttribute(
      "href",
      "#/register",
    );

    const server = screen.getByText("server.mjs", { selector: "figcaption" }).closest("figure");
    expect(
      within(server as HTMLElement).getByText(/app\.post\("\/auth\/login"/),
    ).toBeInTheDocument();
    expect(screen.getByText("LoginPage.tsx", { selector: "figcaption" })).toBeInTheDocument();
    expect(screen.getByText(/AUTH_API_URL=http:\/\/localhost:8080/)).toBeInTheDocument();
  });

  it("s'affiche dans le dashboard pour un tenant connecté", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ refreshToken: "refresh-0", user: tenant }));
    mockApi({ "POST /tenants/refresh": () => [200, tokens("1")] });
    await renderApp("#/docs");

    expect(await screen.findByRole("heading", { name: "Comment commencer" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Comment commencer/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("C'est déjà fait : vous êtes connecté.")).toBeInTheDocument();
  });
});
