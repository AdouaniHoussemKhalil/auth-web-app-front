import { Typography } from "@quickadui/core";
import { Container, Flex } from "@quickadui/layout";
import type { ReactNode } from "react";
import { Link } from "./Link";
import { ThemeToggle } from "./ThemeToggle";

/** Mise en page des pages publiques lues sans être connecté (documentation). */
export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-1">
      <Flex
        justify="between"
        align="center"
        className="border-b border-neutral-6 bg-neutral-2 px-6 py-3"
      >
        <Link to="/login" className="text-neutral-12">
          <Typography variant="h4" as="span">
            Auth Console
          </Typography>
        </Link>
        <Flex align="center" gap="md">
          <Link to="/login" className="text-sm text-neutral-11 hover:text-neutral-12">
            Se connecter
          </Link>
          <ThemeToggle />
        </Flex>
      </Flex>
      <Container maxWidth="lg" className="px-4 py-10">
        {children}
      </Container>
    </div>
  );
}
