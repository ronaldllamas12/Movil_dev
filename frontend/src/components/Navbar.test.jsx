import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import Navbar from "./Navbar.jsx"
import { renderWithProviders } from "../test/testUtils.jsx"

describe("Navbar", () => {
  it("muestra marca y enlaces principales", async () => {
    renderWithProviders(<Navbar />)

    await waitFor(() => {
      expect(screen.getByText(/Movil Dev/i)).toBeInTheDocument()
    })
    expect(screen.getAllByRole("link", { name: /inicio/i }).length).toBeGreaterThanOrEqual(1)
  })
})
