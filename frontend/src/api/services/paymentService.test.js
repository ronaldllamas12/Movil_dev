import { beforeEach, describe, expect, it, vi } from "vitest"

const api = vi.hoisted(() => ({
  post: vi.fn(),
}))

vi.mock("../axiosClient", () => ({ default: api }))

import { capturePayPalOrder, createEpaycoSession, createPayPalOrder } from "./paymentService.js"

describe("paymentService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("createPayPalOrder y createEpaycoSession usan timeout extendido", async () => {
    api.post.mockResolvedValue({ data: { id: "x" } })

    await createPayPalOrder({ amount: 1 })
    expect(api.post).toHaveBeenCalledWith("/payments/paypal/create-order", { amount: 1 }, { timeout: 30000 })

    await createEpaycoSession({ ref: "r" })
    expect(api.post).toHaveBeenCalledWith("/payments/epayco/create-session", { ref: "r" }, { timeout: 30000 })
  })

  it("capturePayPalOrder envía token y db_order_id en query", async () => {
    api.post.mockResolvedValue({ data: { success: true } })

    await capturePayPalOrder("tok", 99)

    expect(api.post).toHaveBeenCalledWith(
      "/payments/paypal/capture-order",
      null,
      expect.objectContaining({
        timeout: 30000,
        params: { token: "tok", db_order_id: 99 },
      }),
    )
  })
})
