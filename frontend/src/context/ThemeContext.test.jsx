import { act, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ThemeProvider, useTheme } from "./ThemeContext.jsx"

function ThemeReader() {
  const { theme, toggleTheme } = useTheme()
  return (
    <div>
      <span data-testid="t">{theme}</span>
      <button type="button" onClick={toggleTheme}>
        toggle
      </button>
    </div>
  )
}

describe("ThemeContext", () => {
  it("alterna tema claro/oscuro", () => {
    render(
      <ThemeProvider>
        <ThemeReader />
      </ThemeProvider>,
    )

    expect(screen.getByTestId("t")).toHaveTextContent("light")
    act(() => {
      screen.getByRole("button", { name: /toggle/i }).click()
    })
    expect(screen.getByTestId("t")).toHaveTextContent("dark")
  })
})
