import type { ComponentProps } from "react";

export interface LinkProps extends Omit<ComponentProps<"a">, "href"> {
  to: string;
}

/** Lien interne : un vrai `<a href="#/...">`, donc ouverture dans un nouvel onglet et clavier natifs. */
export function Link({ to, ...props }: LinkProps) {
  return <a href={`#${to}`} {...props} />;
}
