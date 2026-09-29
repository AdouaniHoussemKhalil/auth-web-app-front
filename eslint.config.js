import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/", "coverage/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // Charte graphique : les boutons passent par @/components/Button (couleurs noir/blanc).
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@quickadui/core",
              importNames: ["Button", "IconButton"],
              message: "Utiliser Button / IconButton de @/components/Button (charte graphique).",
            },
          ],
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Le composant de la charte habille ceux de QuickadUI : il est le seul à pouvoir les importer.
    files: ["src/components/Button.tsx"],
    rules: { "no-restricted-imports": "off" },
  },
  prettier,
);
