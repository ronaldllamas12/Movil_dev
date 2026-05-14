import { beforeEach, describe, expect, it, vi } from "vitest"

const axiosClient = vi.hoisted(() => ({
  get: vi.fn(),
}))

vi.mock("../axiosClient.js", () => ({ default: axiosClient }))

import { getSalesReport } from "./salesReportService.js"

describe("salesReportService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("getSalesReport GET /orders/admin/reports/sales", async () => {
    axiosClient.get.mockResolvedValue({ data: { rows: [] } })

    const data = await getSalesReport()

    expect(axiosClient.get).toHaveBeenCalledWith("/orders/admin/reports/sales")
    expect(data).toEqual({ rows: [] })
  })
})
