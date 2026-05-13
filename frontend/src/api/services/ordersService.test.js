/**
 * Pruebas del servicio de pedidos; downloadOrderInvoice toca el DOM (enlace temporal + blob).
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

const axiosClient = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
}))

vi.mock("../axiosClient.js", () => ({ default: axiosClient }))

import {
  downloadOrderInvoice,
  getAllOrders,
  markEpaycoOrderPaid,
  refundOrder,
  sendOrderInvoice,
  updateOrderStatus,
} from "./ordersService.js"

describe("ordersService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("getAllOrders y updateOrderStatus", async () => {
    axiosClient.get.mockResolvedValue({ data: [{ id: 1 }] })
    axiosClient.put.mockResolvedValue({ data: { ok: true } })

    expect(await getAllOrders()).toEqual([{ id: 1 }])
    expect(axiosClient.get).toHaveBeenCalledWith("/orders/admin/")

    await updateOrderStatus(5, "shipped", "ok", "DHL", "TRACK1")
    expect(axiosClient.put).toHaveBeenCalledWith("/orders/admin/5/status", {
      status: "shipped",
      reason: "ok",
      shipping_company: "DHL",
      tracking_number: "TRACK1",
    })
  })

  it("sendOrderInvoice, refundOrder y markEpaycoOrderPaid", async () => {
    axiosClient.post.mockResolvedValue({ data: { sent: true } })

    expect(await sendOrderInvoice(3)).toEqual({ sent: true })
    expect(axiosClient.post).toHaveBeenCalledWith("/orders/admin/3/invoice/send")

    await refundOrder(4, { amount: 1 })
    expect(axiosClient.post).toHaveBeenCalledWith("/orders/admin/4/refund", { amount: 1 })

    await markEpaycoOrderPaid(9)
    expect(axiosClient.post).toHaveBeenCalledWith("/orders/epayco/mark-paid/9")
  })

  it("downloadOrderInvoice solicita PDF como blob", async () => {
    axiosClient.get.mockResolvedValue({ data: new Uint8Array([1, 2, 3]) })
    const click = vi.fn()
    const orig = document.createElement.bind(document)
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "a") {
        const el = orig("a")
        el.click = click
        return el
      }
      return orig(tag)
    })

    await downloadOrderInvoice(7)

    expect(axiosClient.get).toHaveBeenCalledWith("/orders/admin/7/invoice", { responseType: "blob" })
    expect(click).toHaveBeenCalled()
  })
})
