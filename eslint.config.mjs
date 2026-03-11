import nextConfig from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  ...nextConfig,
  ...nextTypescript,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // Ignore auto-generated shadcn/ui components
  {
    ignores: ["components/ui/**"],
  },
]

export default eslintConfig
