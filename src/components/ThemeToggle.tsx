import { Button } from "@quickadui/core";
import { useTheme, type ThemeMode } from "@quickadui/theme";

const NEXT: Record<ThemeMode, ThemeMode> = { light: "dark", dark: "system", system: "light" };
const LABELS: Record<ThemeMode, string> = { light: "Clair", dark: "Sombre", system: "Système" };

/** Bascule clair → sombre → système. Libellé texte : @quickadui/icons n'a pas d'icône soleil/lune. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(NEXT[theme])}
      aria-label={`Thème : ${LABELS[theme]}. Passer en ${LABELS[NEXT[theme]].toLowerCase()}`}
    >
      Thème : {LABELS[theme]}
    </Button>
  );
}
