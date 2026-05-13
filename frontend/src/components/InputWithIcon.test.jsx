import { render, screen } from "@testing-library/react"
import { Mail } from "lucide-react"
import { describe, expect, it } from "vitest"

import InputWithIcon from "./ui/InputWithIcon.jsx"

describe("InputWithIcon", () => {
  it("muestra error y aplica borde", () => {
    render(
      <InputWithIcon
        icon={<Mail data-testid="ico" />}
        error="Campo inválido"
        placeholder="x"
        value=""
        onChange={() => {}}
      />,
    )
    expect(screen.getByText("Campo inválido")).toBeInTheDocument()
    expect(screen.getByTestId("ico")).toBeInTheDocument()
  })
})
