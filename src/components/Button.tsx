import {
  Button as QuickadButton,
  IconButton as QuickadIconButton,
  type ButtonProps,
  type IconButtonProps,
} from "@quickadui/core";
import { cn } from "@quickadui/utils";

/**
 * Couleurs des boutons de la charte : principal noir en clair / blanc en sombre (neutral-12 sur
 * neutral-1), secondaires neutres. QuickadUI colore toutes ses variantes en accent (orange).
 * `className` est fusionné après la variante QuickadUI (tailwind-merge) : ces classes la remplacent.
 */
const BRAND_VARIANTS = {
  solid: "bg-neutral-12 text-neutral-1 hover:bg-neutral-11",
  soft: "bg-neutral-3 text-neutral-12 hover:bg-neutral-4",
  outline: "border border-neutral-7 bg-transparent text-neutral-12 hover:bg-neutral-3",
  ghost: "bg-transparent text-neutral-12 hover:bg-neutral-3",
  destructive: "",
} as const;

type Variant = keyof typeof BRAND_VARIANTS;

export function Button({ variant, className, ...props }: ButtonProps) {
  return (
    <QuickadButton
      variant={variant}
      className={cn(BRAND_VARIANTS[(variant ?? "solid") as Variant], className)}
      {...props}
    />
  );
}

export function IconButton({ variant, className, ...props }: IconButtonProps) {
  return (
    <QuickadIconButton
      variant={variant}
      className={cn(BRAND_VARIANTS[(variant ?? "ghost") as Variant], className)}
      {...props}
    />
  );
}
