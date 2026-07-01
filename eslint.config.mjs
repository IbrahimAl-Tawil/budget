import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Off by choice. This rule flags any setState() called synchronously in a
      // useEffect body (to prevent cascading re-renders). In this codebase it only
      // fires on deliberate, harmless patterns — mount flags
      // (`useEffect(() => setMounted(true), [])`), syncing a form to the selected
      // entity when a modal opens, and kicking off a fetch when a dialog opens —
      // so it was pure noise blocking CI. Flip to "warn"/"error" to reinstate.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
