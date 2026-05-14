import { beforeEach, describe, expect, it, vi } from "vitest"

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}))

vi.mock("../axiosClient", () => ({ default: api }))

import {
  connectWhatsApp,
  disconnectWhatsApp,
  getWhatsAppQR,
  getWhatsAppStatus,
} from "./whatsappService.js"

describe("whatsappService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("getWhatsAppStatus y getWhatsAppQR devuelven data", async () => {
    api.get.mockResolvedValueOnce({ data: { ok: true } })
    api.get.mockResolvedValueOnce({ data: { qr: "x" } })

    expect(await getWhatsAppStatus()).toEqual({ ok: true })
    expect(await getWhatsAppQR()).toEqual({ qr: "x" })
  })

  it("connectWhatsApp y disconnectWhatsApp hacen POST", async () => {
    api.post.mockResolvedValue({ data: { connected: 1 } })

    expect(await connectWhatsApp()).toEqual({ connected: 1 })
    expect(await disconnectWhatsApp()).toEqual({ connected: 1 })
    expect(api.post).toHaveBeenCalledWith("/admin/whatsapp/connect")
    expect(api.post).toHaveBeenCalledWith("/admin/whatsapp/disconnect")
  })
})
