import { renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

describe("useGoogleAuth", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it("sin VITE_GOOGLE_CLIENT_ID deshabilita Google", async () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "")
    vi.resetModules()
    const { default: useGoogleAuth } = await import("./useGoogleAuth.js")
    const { result } = renderHook(() =>
      useGoogleAuth({ onCredential: vi.fn(), activeTab: "login" }),
    )
    expect(result.current.isGoogleEnabled).toBe(false)
  })
})
