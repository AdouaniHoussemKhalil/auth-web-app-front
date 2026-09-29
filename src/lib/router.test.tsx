import { act, render, screen } from "@testing-library/react";
import { Link } from "@/components/Link";
import { matchPath, navigate, usePath } from "./router";

describe("matchPath", () => {
  it("extrait les paramètres d'un chemin correspondant", () => {
    expect(matchPath("/apps/:appId", "/apps/42")).toEqual({ appId: "42" });
    expect(matchPath("/", "/")).toEqual({});
  });

  it("refuse un chemin différent ou de longueur différente", () => {
    expect(matchPath("/apps/:appId", "/apps")).toBeNull();
    expect(matchPath("/apps", "/settings")).toBeNull();
  });

  it("décode les paramètres", () => {
    expect(matchPath("/apps/:appId", "/apps/a%20b")).toEqual({ appId: "a b" });
  });
});

function CurrentPath() {
  return <p>{usePath()}</p>;
}

describe("usePath / navigate / Link", () => {
  afterEach(() => {
    window.location.hash = "";
  });

  it("suit le hash de l'URL, sans la query string", async () => {
    render(<CurrentPath />);
    expect(screen.getByText("/")).toBeInTheDocument();

    await act(async () => {
      navigate("/apps?page=2");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(screen.getByText("/apps")).toBeInTheDocument();
  });

  it("rend un vrai lien avec le hash", () => {
    render(<Link to="/apps">Applications</Link>);
    expect(screen.getByRole("link", { name: "Applications" })).toHaveAttribute("href", "#/apps");
  });
});
