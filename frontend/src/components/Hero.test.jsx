import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import Hero from "./Hero.jsx"
import { ThemeProvider } from "../context/ThemeContext.jsx"

describe("Hero", () => {
  it("usa slides por defecto cuando no hay destacados", () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <Hero products={[]} />
        </ThemeProvider>
      </MemoryRouter>,
    )
    expect(screen.getByText("Promociones en celulares")).toBeInTheDocument()
  })
})
