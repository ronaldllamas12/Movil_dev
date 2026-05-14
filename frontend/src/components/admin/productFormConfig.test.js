import { describe, expect, it } from "vitest"

import { BASE_CREATE_FORM, CATEGORY_OPTIONS } from "./productFormConfig.js"

describe("productFormConfig", () => {
  it("expone categorías y campos base", () => {
    expect(CATEGORY_OPTIONS).toContain("premium")
    expect(BASE_CREATE_FORM.categoria).toBe("premium")
    expect(BASE_CREATE_FORM.is_active).toBe(true)
  })
})
