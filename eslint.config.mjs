import nextConfig from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  ...nextConfig,
  ...nextTypescript,
  {
    rules: {
      // Variables préfixées par _ sont intentionnellement non utilisées (convention)
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // Ignore auto-generated / vendored files
  {
    ignores: [
      "components/ui/**",   // shadcn/ui auto-generated
      "hooks/use-toast.ts", // shadcn/ui auto-generated hook
      "public/**",          // vendored assets (redoc.standalone.js, etc.)
      ".next/**",
      "coverage/**",        // rapports de couverture générés par vitest
    ],
  },
]

export default eslintConfig
