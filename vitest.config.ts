import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    coverage: {
      provider: "v8",
      // Inclure uniquement les utilitaires lib/ — les route handlers et
      // composants React relèvent des tests d'intégration, pas unitaires.
      include: ["lib/**/*.ts"],
      exclude: [
        "lib/supabase/**",    // thin wrappers Supabase, pas de logique propre
        "lib/types.ts",       // interfaces/types uniquement, aucun code runtime
        "lib/utils.ts",       // wrapper cn() shadcn (clsx + twMerge), trivial
        "lib/encryption.ts",  // supprimé — remplacé par TMDB_API_READ_ACCESS_TOKEN env var
      ],
      thresholds: {
        lines: 80,
        functions: 80,
      },
      reporter: ["text", "lcov"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
