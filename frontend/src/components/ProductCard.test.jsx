import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import ProductCard from "./ProductCard.jsx"
import { renderWithProviders } from "../test/testUtils.jsx"

vi.mock("../api/services/productsService", () => ({
  getProductById: vi.fn(async (id) => ({
    id,
    referencia: "R",
    marca: "Marca",
    nombre: "Test Phone",
    categoria: "premium",
    descripcion_breve: "Descripción corta",
    cantidad_stock: 5,
    precio_unitario: 100000,
    colores_disponibles: [],
    color_variants: [],
    is_active: true,
  })),
}))

describe("ProductCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("muestra datos y abre modal de detalles", async () => {
    const user = userEvent.setup()
    const product = {
      id: 1,
      nombre: "Test Phone",
      marca: "Marca",
      cantidad_stock: 5,
      precio: 100000,
      formattedPrice: "100.000",
      image: "https://placehold.co/100",
      rating: 4.5,
      reviews: 2,
    }

    renderWithProviders(<ProductCard product={product} />)

    expect(screen.getByText("Test Phone")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /detalles/i }))

    await waitFor(() => {
      expect(screen.getByText("Descripción corta")).toBeInTheDocument()
    })
  })
})
