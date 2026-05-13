import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import Categories from "./categories.jsx"
import ContactBanner from "./ContactBanner.jsx"
import Features from "./Features.jsx"
import Footer from "./Footer.jsx"

describe("Features", () => {
  it("lista beneficios", () => {
    render(<Features />)
    expect(screen.getByText("Envío Gratis")).toBeInTheDocument()
    expect(screen.getByText("Garantía Oficial")).toBeInTheDocument()
  })
})

describe("Footer", () => {
  it("muestra enlaces rápidos", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    )
    expect(screen.getByText("Enlaces Rápidos")).toBeInTheDocument()
  })
})

describe("Categories", () => {
  it("muestra categorías con enlaces", () => {
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>,
    )
    expect(screen.getByRole("heading", { name: /categorías/i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 3, name: "Premium" })).toBeInTheDocument()
  })
})

describe("ContactBanner", () => {
  it("muestra CTA de contacto y catálogo", () => {
    render(
      <MemoryRouter>
        <ContactBanner />
      </MemoryRouter>,
    )
    expect(screen.getByRole("link", { name: /contactar/i })).toHaveAttribute("href", expect.stringContaining("wa.me"))
    expect(screen.getByRole("link", { name: /explorar catálogo/i })).toHaveAttribute("href", "/catalogo")
  })
})
