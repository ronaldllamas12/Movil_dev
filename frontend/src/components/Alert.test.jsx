import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import Alert from "./ui/Alert.jsx"

describe("Alert", () => {
  it("no renderiza sin mensaje", () => {
    const { container } = render(<Alert message="" />)
    expect(container.firstChild).toBeNull()
  })

  it("muestra variantes y lista de mensajes", () => {
    render(<Alert variant="success" message={["A", "B"]} />)
    const el = screen.getByRole("alert")
    expect(el).toHaveTextContent("A")
    expect(el).toHaveTextContent("B")
  })
})
