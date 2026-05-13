import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import Sidebar from "./Sidebar.jsx"

describe("Sidebar", () => {
  it("notifica selección de módulo", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(<Sidebar selected="carrito" onSelect={onSelect} />)

    await user.click(screen.getByRole("button", { name: /gestión productos/i }))
    expect(onSelect).toHaveBeenCalledWith("productos")
  })
})
