import { defineConfig } from "cypress"
import coverageTask from "@cypress/code-coverage/task"

/**
 * Cypress E2E + @cypress/code-coverage (instrumentación vía vite-plugin-istanbul en `npm run dev:coverage`).
 */
export default defineConfig({
  video: false,
  e2e: {
    baseUrl: "http://localhost:5173",
    supportFile: "cypress/support/e2e.js",
    specPattern: "cypress/e2e/**/*.cy.js",
    setupNodeEvents(on, config) {
      coverageTask(on, config)
      return config
    },
  },
})
