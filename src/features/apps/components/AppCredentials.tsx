import { Alert, AlertDescription, AlertTitle, CopyButton, CopyField } from "@quickadui/core";
import { Button } from "@/components/Button";
import { Label } from "@quickadui/forms";
import { Flex, Stack } from "@quickadui/layout";
import { useState } from "react";

const MASK = "•".repeat(32);

export interface AppCredentialsProps {
  appId: string;
  secretKey: string;
}

/**
 * Identifiants à configurer côté back-end de l'application (en-têtes x-app-id / x-app-secret).
 * Le secret est masqué par défaut et reste copiable sans être affiché.
 */
export function AppCredentials({ appId, secretKey }: AppCredentialsProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Label>x-app-id</Label>
        <CopyField value={appId} />
      </Stack>
      <Stack gap="xs">
        <Label>x-app-secret</Label>
        <Flex gap="sm" align="center">
          <code className="flex-1 truncate rounded-md border border-neutral-6 bg-neutral-2 px-3 py-2 font-mono text-sm">
            {revealed ? secretKey : <span aria-hidden="true">{MASK}</span>}
            {!revealed && <span className="sr-only">Secret masqué</span>}
          </code>
          <Button variant="outline" size="sm" onClick={() => setRevealed((value) => !value)}>
            {revealed ? "Masquer" : "Afficher"}
          </Button>
          <CopyButton value={secretKey} />
        </Flex>
      </Stack>
      <Alert variant="warning">
        <AlertTitle>Secret à garder côté serveur</AlertTitle>
        <AlertDescription>
          Le secret donne accès à tous les comptes de l'application : ne l'intégrez jamais dans un
          front web ou mobile. En cas de fuite, régénérez-le.
        </AlertDescription>
      </Alert>
    </Stack>
  );
}
