import { IconButton } from "@/components/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@quickadui/core";
import { useTheme, type ThemeMode } from "@quickadui/theme";
// @quickadui/icons est construit sur lucide-react mais n'expose pas soleil / lune / écran.
import { Monitor, Moon, Sun } from "lucide-react";

const NEXT: Record<ThemeMode, ThemeMode> = { light: "dark", dark: "system", system: "light" };
const LABELS: Record<ThemeMode, string> = { light: "clair", dark: "sombre", system: "système" };
const ICONS: Record<ThemeMode, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };

/** Bascule clair → sombre → système ; l'icône montre le thème courant. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const Icon = ICONS[theme];
  const label = `Thème ${LABELS[theme]} (passer en ${LABELS[NEXT[theme]]})`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <IconButton aria-label={label} onClick={() => setTheme(NEXT[theme])}>
          <Icon aria-hidden="true" />
        </IconButton>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
