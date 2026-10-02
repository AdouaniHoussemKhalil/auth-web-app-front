import { Typography } from "@quickadui/core";
import {
  DashboardLayout,
  Navbar,
  NavbarActions,
  NavbarBrand,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarNavItem,
  SidebarTrigger,
} from "@quickadui/shell";
import type { ReactNode } from "react";
import { isNavItemActive, NAV_ITEMS } from "./navigation";
import { ThemeToggle } from "./ThemeToggle";

export interface AppShellProps {
  path: string;
  /** Actions supplémentaires de la barre du haut (menu utilisateur…). */
  actions?: ReactNode | undefined;
  children: ReactNode;
}

/** Cadre des pages connectées : barre du haut, navigation latérale, contenu défilant. */
export function AppShell({ path, actions, children }: AppShellProps) {
  return (
    <DashboardLayout
      navbar={
        <Navbar>
          <NavbarBrand>
            <SidebarTrigger aria-label="Afficher ou masquer la navigation" />
            <Typography variant="h4" as="span">
              Auth Console
            </Typography>
          </NavbarBrand>
          <NavbarActions>
            <ThemeToggle />
            {actions}
          </NavbarActions>
        </Navbar>
      }
      sidebar={
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              {NAV_ITEMS.map((item) => (
                <SidebarNavItem
                  key={item.to}
                  href={`#${item.to}`}
                  icon={<item.icon />}
                  active={isNavItemActive(item.to, path)}
                  aria-current={isNavItemActive(item.to, path) ? "page" : undefined}
                >
                  {item.label}
                </SidebarNavItem>
              ))}
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      }
    >
      <main className="p-6">{children}</main>
    </DashboardLayout>
  );
}
