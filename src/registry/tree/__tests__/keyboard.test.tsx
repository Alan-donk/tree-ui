import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Tree } from "@/registry/tree/tree"
import type { TreeNode } from "@/registry/tree/types"

const data: TreeNode[] = [
  {
    id: "src",
    label: "src",
    children: [
      { id: "src/alpha.ts", label: "alpha.ts" },
      {
        id: "src/beta",
        label: "beta",
        children: [{ id: "src/beta/gamma.ts", label: "gamma.ts" }],
      },
    ],
  },
  { id: "readme", label: "README.md" },
]

function setup() {
  const user = userEvent.setup()
  const onSelectionChange = vi.fn()
  render(
    <Tree
      data={data}
      aria-label="Project files"
      defaultExpandedIds={["src"]}
      onSelectionChange={onSelectionChange}
    />,
  )
  const rows = () => screen.getAllByRole("treeitem")
  return { user, rows, onSelectionChange }
}

describe("Tree keyboard navigation", () => {
  it("moves focus with arrows and clamps at the ends", async () => {
    const { user, rows } = setup()
    rows()[0]?.focus()

    await user.keyboard("{ArrowDown}")
    expect(rows()[1]).toHaveFocus()

    await user.keyboard("{ArrowDown}{ArrowDown}")
    expect(rows()[3]).toHaveFocus()

    await user.keyboard("{ArrowDown}")
    expect(rows()[3]).toHaveFocus()

    await user.keyboard("{Home}")
    expect(rows()[0]).toHaveFocus()

    await user.keyboard("{End}")
    expect(rows()[3]).toHaveFocus()
  })

  it("expands with ArrowRight and enters the first child", async () => {
    const { user, rows } = setup()
    const beta = screen.getByRole("treeitem", { name: "beta" })

    beta.focus()
    await user.keyboard("{ArrowRight}")
    expect(beta).toHaveAttribute("aria-expanded", "true")

    await user.keyboard("{ArrowRight}")
    expect(rows()[3]).toHaveTextContent("gamma.ts")
    expect(rows()[3]).toHaveFocus()
  })

  it("collapses with ArrowLeft and returns to the parent", async () => {
    const { user, rows } = setup()
    const beta = screen.getByRole("treeitem", { name: "beta" })

    beta.focus()
    await user.keyboard("{ArrowRight}")
    expect(beta).toHaveAttribute("aria-expanded", "true")

    await user.keyboard("{ArrowRight}")
    const gamma = rows()[3]
    if (!gamma) throw new Error("expected gamma row")
    expect(gamma).toHaveFocus()

    await user.keyboard("{ArrowLeft}")
    expect(beta).toHaveFocus()

    await user.keyboard("{ArrowLeft}")
    expect(beta).toHaveAttribute("aria-expanded", "false")
    expect(rows()).toHaveLength(4)
  })

  it("selects with Enter and Space", async () => {
    const { user, rows, onSelectionChange } = setup()
    rows()[0]?.focus()

    await user.keyboard("{Enter}")
    expect(onSelectionChange).toHaveBeenLastCalledWith(["src"])
    expect(rows()[0]).toHaveAttribute("aria-selected", "true")

    await user.keyboard("{ArrowDown}{ }")
    expect(onSelectionChange).toHaveBeenLastCalledWith(["src/alpha.ts"])
  })

  it("expands every sibling with *", async () => {
    const { user } = setup()

    screen.getByRole("treeitem", { name: "beta" }).focus()
    await user.keyboard("*")

    expect(screen.getByRole("treeitem", { name: "beta" })).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("treeitem", { name: "src" })).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("treeitem", { name: "gamma.ts" })).toBeInTheDocument()
  })

  it("jumps to a matching node with typeahead", async () => {
    const { user } = setup()
    screen.getByRole("treeitem", { name: "src" }).focus()

    await user.keyboard("r")
    expect(screen.getByRole("treeitem", { name: "README.md" })).toHaveFocus()
  })

  it("toggles expansion when selection is disabled", async () => {
    const user = userEvent.setup()
    render(<Tree data={data} aria-label="Project files" selectionMode="none" />)

    const src = screen.getByRole("treeitem", { name: "src" })
    src.focus()
    await user.keyboard("{Enter}")

    expect(src).toHaveAttribute("aria-expanded", "true")
  })

  it("toggles expansion on double click", async () => {
    const user = userEvent.setup()
    render(<Tree data={data} aria-label="Project files" />)

    const src = screen.getByRole("treeitem", { name: "src" })
    await user.dblClick(src)
    expect(src).toHaveAttribute("aria-expanded", "true")
  })
})
