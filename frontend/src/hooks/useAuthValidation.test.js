import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import useAuthValidation from "../hooks/useAuthValidation.js"

describe("useAuthValidation", () => {
  it("valida email y contraseña débil", () => {
    const { result } = renderHook(() => useAuthValidation())

    act(() => {
      result.current.handleEmailChange("mal")
    })
    expect(result.current.emailError.length).toBeGreaterThan(0)

    act(() => {
      result.current.handlePasswordChange("123")
    })
    expect(result.current.passwordError).toContain("8 caracteres")
  })

  it("validación completa del registro sin errores", () => {
    const { result } = renderHook(() => useAuthValidation())

    act(() => {
      result.current.handleNameChange("Ana")
      result.current.handleEmailChange("ana@test.com")
      result.current.handlePasswordChange("password1")
      result.current.handleConfirmPasswordChange("password1")
    })

    let errs
    act(() => {
      errs = result.current.validateAllRegisterFields()
    })

    expect(errs.nameErr).toBe("")
    expect(errs.emailErr).toBe("")
    expect(errs.passwordErr).toBe("")
    expect(errs.confirmPasswordErr).toBe("")
    expect(result.current.isRegisterFormValid()).toBeTruthy()
  })
})
