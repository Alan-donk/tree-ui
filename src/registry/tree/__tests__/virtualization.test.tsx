import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { Tree } from "@/registry/tree/tree"
import type { TreeNode } from "@/registry/tree/types"

const many: TreeNode[] = Array.from({ length: 200 }, (_, index) => ({
  id: `node-${index}`,
  label: `Node ${index}`,
}))

describe("Tree virtualization", () => {
  it("only mounts the rows inside the window plus overscan", () => {
    render(<Tree data={many} aria-label="Many nodes" height={96} overscan={2} />)

    const rows = screen.getAllByRole("treeitem")
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.length).toBeLessThan(30)
    expect(screen.getByRole("treeitem", { name: "Node 0" })).toBeInTheDocument()
    expect(screen.queryByRole("treeitem", { name: "Node 199" })).not.toBeInTheDocument()
  })

  it("renders everything when no height is provided", () => {
    render(<Tree data={many} aria-label="Many nodes" />)

    expect(screen.getAllByRole("treeitem")).toHaveLength(200)
  })

  it("scrolls the window when the user scrolls", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Tree data={many} aria-label="Many nodes" height={96} overscan={2} />,
    )

    const scroller = container.querySelector<HTMLElement>("[data-tree-scroll]")
    if (!scroller) throw new Error("expected a scroll container")

    scroller.scrollTop = 3200
    scroller.dispatchEvent(new Event("scroll", { bubbles: true }))

    await waitFor(() => {
      expect(screen.getByRole("treeitem", { name: "Node 100" })).toBeInTheDocument()
    })
    expect(screen.queryByRole("treeitem", { name: "Node 0" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("treeitem", { name: "Node 100" }))
    expect(screen.getByRole("treeitem", { name: "Node 100" })).toHaveAttribute("aria-selected", "true")
  })

  it("focuses and reveals a row reached with the keyboard", async () => {
    const user = userEvent.setup()
    render(<Tree data={many} aria-label="Many nodes" height={96} overscan={2} />)

    screen.getByRole("treeitem", { name: "Node 0" }).focus()
    await user.keyboard("{End}")

    await waitFor(() => {
      const last = screen.getByRole("treeitem", { name: "Node 199" })
      expect(last).toBeInTheDocument()
      expect(last).toHaveFocus()
    })
  })

  it("still exposes accurate aria metadata for windowed rows", async () => {
    render(<Tree data={many} aria-label="Many nodes" height={96} overscan={2} />)

    const first = screen.getByRole("treeitem", { name: "Node 0" })
    expect(first).toHaveAttribute("aria-posinset", "1")
    expect(first).toHaveAttribute("aria-setsize", "200")
  })
})
