import { TooltipProvider } from "@quickadui/core";
import { Toaster } from "@quickadui/overlays";
import { ThemeProvider } from "@quickadui/theme";
import type { ReactNode } from "react";
import { AuthProvider } from "@/features/auth";

/** Contextes transverses de l'application. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
