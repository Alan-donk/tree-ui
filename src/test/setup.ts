import "@testing-library/jest-dom/vitest"

import { cleanup } from "@testing-library/react"
import axe from "axe-core"
import { afterEach, expect } from "vitest"

afterEach(() => {
  cleanup()
})

/**
 * Runs axe on a rendered container. Color contrast is disabled because jsdom
 * has no layout engine; everything structural (roles, names, ARIA) still runs.
 */
export async function expectNoA11yViolations(container: HTMLElement): Promise<void> {
  const results = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
      region: { enabled: false },
    },
  })
  expect(results.violations).toEqual([])
}
