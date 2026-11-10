import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { App } from "@/demo/App"

describe("demo site", () => {
  it("renders the hero, install command and live examples", () => {
    render(<App />)

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/tree view/i)
    expect(screen.getAllByRole("code").length).toBeGreaterThan(0)
    expect(screen.getByRole("tree", { name: "Project files" })).toBeInTheDocument()
    expect(screen.getByRole("tree", { name: "Workspace packages" })).toBeInTheDocument()
    expect(screen.getByRole("tree", { name: "Teams" })).toBeInTheDocument()
    expect(screen.getByRole("tree", { name: "Files with custom icons" })).toBeInTheDocument()
  })
})
