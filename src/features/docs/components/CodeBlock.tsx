import { CopyButton } from "@quickadui/core";
import { Flex } from "@quickadui/layout";

export interface CodeBlockProps {
  code: string;
  /** Nom de fichier ou langage affiché au-dessus du code. */
  title?: string | undefined;
}

/** Bloc de code monospace, défilant horizontalement, avec bouton de copie. */
export function CodeBlock({ code, title }: CodeBlockProps) {
  return (
    <figure className="overflow-hidden rounded-lg border border-neutral-6 bg-neutral-2">
      <Flex
        justify="between"
        align="center"
        className="border-b border-neutral-6 px-3 py-1.5 text-xs text-neutral-11"
      >
        <figcaption className="font-mono">{title ?? "code"}</figcaption>
        <CopyButton value={code.trim()} size="sm" />
      </Flex>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className="font-mono text-neutral-12">{code.trim()}</code>
      </pre>
    </figure>
  );
}
