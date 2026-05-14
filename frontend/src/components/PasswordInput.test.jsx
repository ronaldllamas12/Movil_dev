import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import PasswordInput from "./auth/PasswordInput.jsx"

describe("PasswordInput", () => {
  it("alterna visibilidad de contraseña", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onToggle = vi.fn()

    render(
      <PasswordInput
        label="Clave"
        value="secret"
        onChange={onChange}
        show={false}
        onToggleShow={onToggle}
        error=""
      />,
    )

    await user.click(screen.getByRole("button", { name: /mostrar contraseña/i }))
    expect(onToggle).toHaveBeenCalled()

    fireEvent.change(screen.getByPlaceholderText("********"), { target: { value: "nuevo" } })
    expect(onChange).toHaveBeenCalledWith("nuevo")
  })
})
