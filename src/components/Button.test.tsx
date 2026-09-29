import { render, screen } from "@testing-library/react";
import { Button, IconButton } from "./Button";

describe("Button de la charte", () => {
  it("rend le bouton principal en neutre inversé (noir en clair, blanc en sombre)", () => {
    render(<Button>Valider</Button>);
    const button = screen.getByRole("button", { name: "Valider" });

    expect(button).toHaveClass("bg-neutral-12", "text-neutral-1");
    expect(button).not.toHaveClass("bg-accent-9");
  });

  it("rend les boutons secondaires en neutre, sans texte orange", () => {
    render(
      <>
        <Button variant="outline">Annuler</Button>
        <Button variant="ghost">Fermer</Button>
      </>,
    );

    for (const name of ["Annuler", "Fermer"]) {
      const button = screen.getByRole("button", { name });
      expect(button).toHaveClass("text-neutral-12");
      expect(button).not.toHaveClass("text-accent-11");
    }
  });

  it("garde le rouge pour les actions destructives", () => {
    render(<Button variant="destructive">Supprimer</Button>);

    expect(screen.getByRole("button", { name: "Supprimer" })).toHaveClass("bg-danger-9");
  });

  it("laisse une classe explicite l'emporter", () => {
    render(<Button className="bg-accent-9">Spécial</Button>);

    expect(screen.getByRole("button", { name: "Spécial" })).toHaveClass("bg-accent-9");
  });

  it("applique aussi la charte aux boutons-icônes", () => {
    render(<IconButton aria-label="Menu">≡</IconButton>);

    expect(screen.getByRole("button", { name: "Menu" })).toHaveClass("text-neutral-12");
  });
});
