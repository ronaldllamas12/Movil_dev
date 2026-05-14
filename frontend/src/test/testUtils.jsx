/**
 * Helpers para montar componentes con los mismos proveedores que en producción (orden similar a main.jsx).
 */
import { render } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { CarritoProvider } from "../context/CarritoContext.jsx"
import { ThemeProvider } from "../context/ThemeContext.jsx"

export function renderWithProviders(ui, { route = "/" } = {}) {
  return render(
    <CarritoProvider>
      <MemoryRouter initialEntries={[route]}>
        <ThemeProvider>{ui}</ThemeProvider>
      </MemoryRouter>
    </CarritoProvider>,
  )
}
