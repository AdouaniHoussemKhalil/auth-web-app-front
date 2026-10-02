import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@quickadui/core";
import type { ReactNode } from "react";

export interface AuthCardProps {
  title: string;
  description?: ReactNode | undefined;
  /** Liens sous le formulaire (« Pas encore de compte ? »…). */
  footer?: ReactNode | undefined;
  children: ReactNode;
}

export function AuthCard({ title, description, footer, children }: AuthCardProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <CardFooter className="text-sm text-neutral-11">{footer}</CardFooter>}
    </Card>
  );
}
