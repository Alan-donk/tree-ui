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
      { id: "src/beta.ts", label: "beta.ts" },
    ],
  },
  {
    id: "docs",
    label: "docs",
    children: [{ id: "docs/readme", label: "README.md" }],
  },
  { id: "readme", label: "README.md" },
]

function rowNames(): string[] {
  return screen.getAllByRole("treeitem").map((row) => row.getAttribute("aria-label") ?? "")
}

describe("Tree filter", () => {
  it("shows matches and their ancestors, and force-expands ancestors", () => {
    render(<Tree data={data} aria-label="Files" filter="readme" />)

    expect(rowNames()).toEqual(["docs", "README.md", "README.md"])
    expect(screen.queryByText("alpha.ts")).not.toBeInTheDocument()
    expect(screen.getByRole("treeitem", { name: "docs" })).toHaveAttribute("aria-expanded", "true")
  })

  it("keeps a matching parent visible without its non-matching descendants", () => {
    render(<Tree data={data} aria-label="Files" filter="src" />)

    expect(rowNames()).toEqual(["src"])
    expect(screen.getByRole("treeitem", { name: "src" })).not.toHaveAttribute("aria-expanded")
  })

  it("is case-insensitive and matches on searchText", () => {
    render(
      <Tree
        data={[
          { id: "a", label: "Alpha", searchText: "first letter" },
          { id: "b", label: "Beta" },
        ]}
        aria-label="Files"
        filter="FIRST"
      />,
    )

    expect(rowNames()).toEqual(["Alpha"])
  })

  it("highlights the matched substring", () => {
    render(<Tree data={data} aria-label="Files" filter="ALP" />)

    const mark = screen.getByText("alp")
    expect(mark.tagName).toBe("MARK")
    expect(mark).toBeInTheDocument()
  })

  it("shows a no-matches message and keeps the tree out of the DOM", () => {
    render(<Tree data={data} aria-label="Files" filter="zzz" />)

    expect(screen.getByText("No matching items")).toBeInTheDocument()
    expect(screen.queryByRole("tree")).not.toBeInTheDocument()
  })

  it("restores the previous expansion when the filter is cleared", () => {
    const { rerender } = render(
      <Tree data={data} aria-label="Files" defaultExpandedIds={["src"]} filter="readme" />,
    )
    expect(rowNames()).toEqual(["docs", "README.md", "README.md"])

    rerender(<Tree data={data} aria-label="Files" defaultExpandedIds={["src"]} filter="" />)

    expect(rowNames()).toEqual(["src", "alpha.ts", "beta.ts", "docs", "README.md"])
  })

  it("keeps filtering compatible with selection", async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    render(<Tree data={data} aria-label="Files" filter="beta" onSelectionChange={onSelectionChange} />)

    await user.click(screen.getByRole("treeitem", { name: "beta.ts" }))

    expect(onSelectionChange).toHaveBeenCalledWith(["src/beta.ts"])
  })

  it("reports filtered sibling counts in aria metadata", () => {
    render(<Tree data={data} aria-label="Files" filter="readme" />)

    const docs = screen.getByRole("treeitem", { name: "docs" })
    const rows = screen.getAllByRole("treeitem", { name: "README.md" })
    const child = rows.find((row) => row.getAttribute("aria-level") === "2")
    expect(child).toBeDefined()
    expect(docs).toHaveAttribute("aria-posinset", "1")
    expect(docs).toHaveAttribute("aria-setsize", "2")
    expect(child).toHaveAttribute("aria-level", "2")
  })
})
