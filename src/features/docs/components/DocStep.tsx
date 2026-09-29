import { Typography } from "@quickadui/core";
import { Flex, Stack } from "@quickadui/layout";
import type { ReactNode } from "react";

export interface DocStepProps {
  number: number;
  title: string;
  children: ReactNode;
}

/** Étape numérotée du guide ; l'ancre #etape-N permet de partager un lien direct. */
export function DocStep({ number, title, children }: DocStepProps) {
  return (
    <section aria-labelledby={`etape-${number}`}>
      <Flex gap="md" align="start">
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-3 text-sm font-semibold text-accent-11"
        >
          {number}
        </span>
        <Stack gap="sm" className="min-w-0 flex-1">
          <Typography variant="h3" id={`etape-${number}`}>
            {title}
          </Typography>
          {children}
        </Stack>
      </Flex>
    </section>
  );
}
