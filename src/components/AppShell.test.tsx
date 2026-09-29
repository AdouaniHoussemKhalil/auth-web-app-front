import { ThemeProvider } from "@quickadui/theme";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "./AppShell";
import { isNavItemActive } from "./navigation";

describe("isNavItemActive", () => {
  it("n'active la racine que sur /", () => {
    expect(isNavItemActive("/", "/")).toBe(true);
    expect(isNavItemActive("/", "/apps")).toBe(false);
  });

  it("active une section pour ses sous-pages", () => {
    expect(isNavItemActive("/apps", "/apps/42")).toBe(true);
    expect(isNavItemActive("/apps", "/applications")).toBe(false);
  });
});

describe("AppShell", () => {
  const renderShell = (path: string) =>
    render(
      <ThemeProvider>
        <AppShell path={path}>
          <p>Contenu</p>
        </AppShell>
      </ThemeProvider>,
    );

  it("affiche la navigation et marque la page courante", () => {
    renderShell("/apps/42");

    expect(screen.getByText("Contenu")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Applications/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: /Tableau de bord/ })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("fait tourner le thème clair → sombre → système", async () => {
    renderShell("/");
    const toggle = () => screen.getByRole("button", { name: /^Thème/ });

    const before = toggle().textContent;
    await userEvent.click(toggle());

    expect(toggle().textContent).not.toBe(before);
  });
});
