import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import AdminDashboard from "./AdminDashboard.jsx"

vi.mock("../context/CarritoContext", () => ({
  useCarrito: () => ({
    isLoggedIn: true,
    isAuthLoading: false,
    currentUser: { id: 1, role: "administrador", email: "admin@test.com" },
    cartSettings: { taxRate: 19, discountRules: [] },
    updateCartSettings: vi.fn(),
    refreshCart: vi.fn(),
  }),
}))

vi.mock("../api/services/cartService", () => ({
  getCartTaxSettings: vi.fn(() => Promise.resolve({ tax_percent: 19 })),
  updateCartTaxSettings: vi.fn(() => Promise.resolve({})),
}))

vi.mock("../api/services/productsService", () => ({
  getProducts: vi.fn(() => Promise.resolve([])),
}))

describe("AdminDashboard", () => {
  it("muestra panel para administrador", async () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/Dashboard de administracion/i)).toBeInTheDocument()
    })
    expect(screen.getByRole("button", { name: /gestión productos/i })).toBeInTheDocument()
  })
})
