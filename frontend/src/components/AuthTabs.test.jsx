import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import AuthTabs from "./auth/AuthTabs.jsx"

describe("AuthTabs", () => {
  it("cambia pestaña activa", async () => {
    const user = userEvent.setup()
    const setActiveTab = vi.fn()

    render(<AuthTabs activeTab="login" setActiveTab={setActiveTab} />)

    await user.click(screen.getByRole("button", { name: /registrarse/i }))
    expect(setActiveTab).toHaveBeenCalledWith("register")

    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }))
    expect(setActiveTab).toHaveBeenCalledWith("login")
  })
})
