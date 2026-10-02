import { Typography } from "@quickadui/core";
import { Flex } from "@quickadui/layout";
import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";

/** Mise en page des pages publiques (connexion, inscription…) : formulaire centré, sans navigation. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-2">
      <Flex justify="between" align="center" className="px-6 py-4">
        <Typography variant="h4" as="span">
          Auth Console
        </Typography>
        <ThemeToggle />
      </Flex>
      <Flex justify="center" align="start" className="flex-1 px-4 pt-8 pb-16 sm:pt-16">
        {children}
      </Flex>
    </div>
  );
}
