import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Tree } from "@/registry/tree/tree"
import type { TreeNode } from "@/registry/tree/types"
import { expectNoA11yViolations } from "@/test/setup"

const data: TreeNode[] = [
  {
    id: "src",
    label: "src",
    children: [
      { id: "src/a.tsx", label: "a.tsx" },
      { id: "src/b.tsx", label: "b.tsx" },
    ],
  },
  { id: "readme", label: "README.md" },
  { id: "ignored", label: "ignored", disabled: true },
]

function ariaRowLevels(container: HTMLElement): Array<number | null> {
  return Array.from(container.querySelectorAll("[role='treeitem']")).map((element) =>
    Number(element.getAttribute("aria-level")),
  )
}

describe("Tree", () => {
  it("renders a labelled treeview with positional metadata", () => {
    render(<Tree data={data} aria-label="Project files" defaultExpandedIds={["src"]} />)

    expect(screen.getByRole("tree", { name: "Project files" })).toBeInTheDocument()

    const rows = screen.getAllByRole("treeitem")
    expect(rows).toHaveLength(5)
    expect(rows[0]).toHaveAttribute("aria-level", "1")
    expect(rows[0]).toHaveAttribute("aria-expanded", "true")
    expect(rows[1]).toHaveAttribute("aria-level", "2")
    expect(rows[1]).toHaveAttribute("aria-posinset", "1")
    expect(rows[1]).toHaveAttribute("aria-setsize", "2")
    expect(rows[2]).toHaveAttribute("aria-posinset", "2")
    expect(rows[1]).not.toHaveAttribute("aria-expanded")
    expect(rows[3]).toHaveAttribute("aria-setsize", "3")
  })

  it("only renders children of expanded nodes", () => {
    const { container } = render(<Tree data={data} aria-label="Project files" />)

    expect(ariaRowLevels(container)).toEqual([1, 1, 1])

    fireEvent.click(screen.getByRole("button", { name: "Expand" }))

    expect(ariaRowLevels(container)).toEqual([1, 2, 2, 1, 1])
  })

  it("collapses children with the chevron", () => {
    const onExpandedChange = vi.fn()
    const { container } = render(
      <Tree
        data={data}
        aria-label="Project files"
        defaultExpandedIds={["src"]}
        onExpandedChange={onExpandedChange}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Collapse" }))

    expect(onExpandedChange).toHaveBeenCalledWith([])
    expect(ariaRowLevels(container)).toHaveLength(3)
  })

  it("supports controlled expansion", () => {
    const onExpandedChange = vi.fn()
    const { container, rerender } = render(
      <Tree data={data} aria-label="Project files" expandedIds={[]} onExpandedChange={onExpandedChange} />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Expand" }))
    expect(onExpandedChange).toHaveBeenCalledWith(["src"])
    expect(ariaRowLevels(container)).toHaveLength(3)

    rerender(
      <Tree
        data={data}
        aria-label="Project files"
        expandedIds={["src"]}
        onExpandedChange={onExpandedChange}
      />,
    )
    expect(ariaRowLevels(container)).toHaveLength(5)
  })

  it("selects a row on click and reports the id", async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    render(
      <Tree data={data} aria-label="Project files" onSelectionChange={onSelectionChange} />,
    )

    await user.click(screen.getByText("README.md"))

    expect(onSelectionChange).toHaveBeenCalledWith(["readme"])
    expect(screen.getByRole("treeitem", { name: "README.md" })).toHaveAttribute("aria-selected", "true")
  })

  it("skips disabled nodes when selecting", async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    render(
      <Tree data={data} aria-label="Project files" onSelectionChange={onSelectionChange} />,
    )

    await user.click(screen.getByText("ignored"))

    expect(onSelectionChange).not.toHaveBeenCalled()
    expect(screen.getByRole("treeitem", { name: "ignored" })).toHaveAttribute("aria-disabled", "true")
  })

  it("supports multiple selection with modifiers and shift ranges", () => {
    const onSelectionChange = vi.fn()
    render(
      <Tree
        data={data}
        aria-label="Project files"
        selectionMode="multiple"
        defaultExpandedIds={["src"]}
        onSelectionChange={onSelectionChange}
      />,
    )

    const [, firstChild, secondChild] = screen.getAllByRole("treeitem")
    if (!firstChild || !secondChild) throw new Error("expected children")

    fireEvent.click(firstChild, { ctrlKey: true })
    expect(onSelectionChange).toHaveBeenLastCalledWith(["src/a.tsx"])

    fireEvent.click(secondChild, { ctrlKey: true })
    expect(onSelectionChange).toHaveBeenLastCalledWith(["src/a.tsx", "src/b.tsx"])

    fireEvent.click(secondChild, { ctrlKey: true })
    expect(onSelectionChange).toHaveBeenLastCalledWith(["src/a.tsx"])
  })

  it("marks the tree as multiselectable in multiple mode", () => {
    render(<Tree data={data} aria-label="Project files" selectionMode="multiple" />)
    expect(screen.getByRole("tree")).toHaveAttribute("aria-multiselectable", "true")
  })

  it("works with selection disabled", async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    render(
      <Tree
        data={data}
        aria-label="Project files"
        selectionMode="none"
        onSelectionChange={onSelectionChange}
      />,
    )

    await user.click(screen.getByText("README.md"))

    expect(onSelectionChange).not.toHaveBeenCalled()
    expect(screen.getByRole("treeitem", { name: "README.md" })).not.toHaveAttribute("aria-selected")
  })

  it("prunes expanded and selected ids removed from the data", () => {
    const { container, rerender } = render(
      <Tree
        data={data}
        aria-label="Project files"
        defaultExpandedIds={["src"]}
        defaultSelectedIds={["src/a.tsx"]}
      />,
    )

    expect(ariaRowLevels(container)).toHaveLength(5)

    rerender(<Tree data={[{ id: "readme", label: "README.md" }]} aria-label="Project files" />)

    expect(ariaRowLevels(container)).toEqual([1])
    expect(screen.getByRole("treeitem", { name: "README.md" })).toHaveAttribute("aria-selected", "false")
  })

  it("warns once about duplicate ids", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    render(
      <Tree
        data={[
          { id: "dup", label: "One" },
          { id: "dup", label: "Two" },
        ]}
        aria-label="Duplicates"
      />,
    )

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toContain("Duplicate node ids")
  })

  it("renders an empty state", () => {
    render(<Tree data={[]} aria-label="Empty" renderEmpty={() => <p>Nothing here</p>} />)
    expect(screen.getByText("Nothing here")).toBeInTheDocument()
  })

  it("has no detectable accessibility violations", async () => {
    const { container } = render(
      <Tree
        data={data}
        aria-label="Project files"
        defaultExpandedIds={["src"]}
        defaultSelectedIds={["readme"]}
      />,
    )

    await expectNoA11yViolations(container)
  })
})
