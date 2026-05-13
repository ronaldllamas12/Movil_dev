import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { describe, expect, it } from "vitest"

import Cancel from "./Cancel.jsx"

describe("Cancel", () => {
  it("navega al carrito", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={["/cancel"]}>
        <Routes>
          <Route path="/cancel" element={<Cancel />} />
          <Route path="/carrito" element={<div>Carrito destino</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("button", { name: /volver al carrito/i }))
    expect(await screen.findByText("Carrito destino")).toBeInTheDocument()
  })

  it("navega al catálogo", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={["/cancel"]}>
        <Routes>
          <Route path="/cancel" element={<Cancel />} />
          <Route path="/catalogo" element={<div>Catálogo destino</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("button", { name: /catálogo/i }))
    expect(await screen.findByText("Catálogo destino")).toBeInTheDocument()
  })
})
