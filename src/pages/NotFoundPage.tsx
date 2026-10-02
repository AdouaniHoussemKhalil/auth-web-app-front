import { Typography } from "@quickadui/core";
import { Button } from "@/components/Button";
import { Stack } from "@quickadui/layout";

export default function NotFoundPage() {
  return (
    <Stack align="center" gap="md" className="py-24 text-center">
      <Typography variant="h1">404</Typography>
      <Typography variant="muted">Cette page n'existe pas.</Typography>
      <Button asChild variant="outline">
        <a href="#/">Retour au tableau de bord</a>
      </Button>
    </Stack>
  );
}
