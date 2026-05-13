import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { describe, expect, it } from "vitest"

import EpaycoCheckoutWindow from "./EpaycoCheckoutWindow.jsx"

describe("EpaycoCheckoutWindow", () => {
  it("sin session_id muestra error", () => {
    render(
      <MemoryRouter initialEntries={["/epayco"]}>
        <Routes>
          <Route path="/epayco" element={<EpaycoCheckoutWindow />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(
      screen.getByText(/No se recibio el identificador de sesion de ePayco/i),
    ).toBeInTheDocument()
  })
})
