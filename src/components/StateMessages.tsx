import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  Typography,
} from "@quickadui/core";
import { Button } from "@/components/Button";
import { Stack } from "@quickadui/layout";
import type { ReactNode } from "react";

/** Erreur de chargement d'une vue, avec « Réessayer ». */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert variant="danger" role="alert">
      <AlertTitle>Chargement impossible</AlertTitle>
      <AlertDescription>
        <Stack gap="sm" align="start">
          <span>{message}</span>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Réessayer
          </Button>
        </Stack>
      </AlertDescription>
    </Alert>
  );
}

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode | undefined;
}

/** Liste vide : explique quoi faire ensuite. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent>
        <Stack align="center" gap="sm" className="py-10 text-center">
          <Typography variant="h4">{title}</Typography>
          <Typography variant="muted">{description}</Typography>
          {action}
        </Stack>
      </CardContent>
    </Card>
  );
}
