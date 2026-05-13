import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import LoadingSpinner from "./ui/LoadingSpinner.jsx"

describe("LoadingSpinner", () => {
  it("muestra mensaje por defecto", () => {
    render(<LoadingSpinner />)
    expect(screen.getByText("Cargando...")).toBeInTheDocument()
  })
})
