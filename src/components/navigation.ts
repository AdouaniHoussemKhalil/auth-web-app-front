import { InfoIcon, SettingsIcon, UserIcon } from "@quickadui/icons";
import type { ComponentType } from "react";

export interface NavItem {
  label: string;
  to: string;
  icon: ComponentType;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Tableau de bord", to: "/", icon: UserIcon },
  { label: "Applications", to: "/apps", icon: SettingsIcon },
  { label: "Comment commencer", to: "/docs", icon: InfoIcon },
];

/** Élément de navigation actif : la racine seulement pour "/", sinon le préfixe (/apps/42 -> Applications). */
export const isNavItemActive = (to: string, path: string) =>
  to === "/" ? path === "/" : path === to || path.startsWith(`${to}/`);
