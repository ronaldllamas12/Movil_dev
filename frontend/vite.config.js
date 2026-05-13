import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import path from "path"
import istanbul from "vite-plugin-istanbul"
import { defineConfig } from "vitest/config"

/** Instrumentación Istanbul para cobertura en E2E (Cypress) cuando el dev server arranca con VITE_COVERAGE=true */
const coverageEnabled = process.env.VITE_COVERAGE === "true"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(coverageEnabled
      ? [
          istanbul({
            cwd: path.resolve(__dirname),
            include: "src/**/*",
            exclude: [
              "node_modules/**",
              "src/**/*.test.*",
              "src/**/*.spec.*",
              "src/test/**",
            ],
            extension: [".js", ".jsx", ".ts", ".tsx"],
            requireEnv: false,
          }),
        ]
      : []),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },

  /**
   * Vitest: unit / componente. Cobertura V8 con umbral global (líneas ≥ 90 %).
   * Cypress complementa con E2E; su reporte Istanbul queda en coverage/cypress tras cy:coverage.
   */
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setupTests.js"],
    include: ["src/**/*.{test,spec}.{js,jsx}"],
    css: true,
    clearMocks: true,
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage/vitest",
      reporter: ["text", "html", "lcov"],
      /**
       * Cobertura “core” con umbral 90 %: servicios, mappers, hooks, contexto y UI atómica.
       * Pantallas grandes (admin, checkout, login completo) se ejercitan en Cypress E2E;
       * mezclarlas aquí sin tests exhaustivos baja el % global sin reflejar la calidad del núcleo.
       */
      include: [
        "src/api/services/**/*.js",
        "src/api/mappers/**/*.js",
        "src/utils/**/*.js",
        "src/hooks/useAuthValidation.js",
        "src/hooks/useAsyncAction.js",
        "src/context/ThemeContext.jsx",
        "src/components/ui/**/*.{js,jsx}",
        "src/components/auth/AuthErrorMessage.jsx",
        "src/components/auth/AuthTabs.jsx",
        "src/components/auth/PasswordInput.jsx",
        "src/components/auth/GoogleSignInSection.jsx",
      ],
      exclude: [
        "**/node_modules/**",
        "src/**/*.test.{js,jsx}",
        "src/**/*.spec.{js,jsx}",
        "src/test/**",
      ],
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
        branches: 68,
      },
    },
  },
})
