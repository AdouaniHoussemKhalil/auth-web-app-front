import { Typography } from "@quickadui/core";
import { Flex } from "@quickadui/layout";
import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  description?: string | undefined;
  /** Actions alignées à droite (bouton « Nouvelle application »…). */
  actions?: ReactNode | undefined;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <Flex justify="between" align="start" gap="md" wrap="wrap" className="mb-6">
      <div>
        <Typography variant="h2">{title}</Typography>
        {description && <Typography variant="muted">{description}</Typography>}
      </div>
      {actions && <Flex gap="sm">{actions}</Flex>}
    </Flex>
  );
}
