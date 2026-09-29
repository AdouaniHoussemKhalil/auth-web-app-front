import type { Consumer } from "@/api/consumers.api";
import { Badge } from "@quickadui/core";
import { Flex } from "@quickadui/layout";

export function ConsumerStatusBadge({ isActive }: { isActive: boolean }) {
  return <Badge variant={isActive ? "success" : "danger"}>{isActive ? "Actif" : "Bloqué"}</Badge>;
}

/** Méthode de connexion et sécurité du compte : Google, MFA, e-mail non vérifié. */
export function ConsumerAccountBadges({ consumer }: { consumer: Consumer }) {
  return (
    <Flex gap="xs" wrap="wrap">
      {consumer.isByGoogle && <Badge variant="outline">Google</Badge>}
      {consumer.isMFAActivated && <Badge variant="outline">MFA</Badge>}
      {!consumer.isEmailVerified && <Badge variant="warning">E-mail non vérifié</Badge>}
    </Flex>
  );
}
