import { Alert, AlertDescription } from "@quickadui/core";
import type { ReactNode } from "react";

/** Erreur globale d'un formulaire (réponse de l'API), annoncée aux lecteurs d'écran. */
export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <Alert variant="danger" role="alert">
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
