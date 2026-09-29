import { TooltipProvider } from "@quickadui/core";
import { Toaster } from "@quickadui/overlays";
import { ThemeProvider } from "@quickadui/theme";
import type { ReactNode } from "react";

/** Contextes transverses de l'application, empilés ici (la session s'ajoutera avec la feature auth). */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
