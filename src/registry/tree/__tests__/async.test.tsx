import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Tree } from "@/registry/tree/tree"
import type { TreeNode } from "@/registry/tree/types"

const asyncData: TreeNode[] = [{ id: "root", label: "Root" }]

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe("Tree async children", () => {
  it("loads children on first expand and caches them", async () => {
    const user = userEvent.setup()
    const loadChildren = vi.fn().mockResolvedValue([{ id: "child", label: "Child" }])

    render(<Tree data={asyncData} aria-label="Async" loadChildren={loadChildren} />)

    await user.click(screen.getByRole("button", { name: "Expand" }))
    expect(loadChildren).toHaveBeenCalledTimes(1)
    expect(await screen.findByText("Child")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Collapse" }))
    await user.click(screen.getByRole("button", { name: "Expand" }))
    expect(loadChildren).toHaveBeenCalledTimes(1)
  })

  it("shows a busy state while loading", async () => {
    const user = userEvent.setup()
    const gate = deferred<TreeNode[]>()
    const loadChildren = vi.fn().mockReturnValue(gate.promise)

    render(<Tree data={asyncData} aria-label="Async" loadChildren={loadChildren} />)

    await user.click(screen.getByRole("button", { name: "Expand" }))
    expect(screen.getByRole("treeitem", { name: "Root" })).toHaveAttribute("aria-busy", "true")

    gate.resolve([{ id: "child", label: "Child" }])
    await waitFor(() =>
      expect(screen.getByRole("treeitem", { name: "Root" })).not.toHaveAttribute("aria-busy"),
    )
    expect(screen.getByText("Child")).toBeInTheDocument()
  })

  it("announces failures and retries from the retry button", async () => {
    const user = userEvent.setup()
    const onLoadError = vi.fn()
    const loadChildren = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce([{ id: "child", label: "Child" }])

    render(
      <Tree data={asyncData} aria-label="Async" loadChildren={loadChildren} onLoadError={onLoadError} />,
    )

    await user.click(screen.getByRole("button", { name: "Expand" }))
    const retry = await screen.findByRole("button", { name: "Retry" })
    expect(onLoadError).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("status")).toHaveTextContent("Couldn't load children.")

    await user.click(retry)
    expect(await screen.findByText("Child")).toBeInTheDocument()
    expect(loadChildren).toHaveBeenCalledTimes(2)
  })

  it("retries with Enter when the focused node failed", async () => {
    const user = userEvent.setup()
    const loadChildren = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce([{ id: "child", label: "Child" }])

    render(<Tree data={asyncData} aria-label="Async" loadChildren={loadChildren} />)

    const root = screen.getByRole("treeitem", { name: "Root" })
    await user.click(screen.getByRole("button", { name: "Expand" }))
    await screen.findByRole("button", { name: "Retry" })

    root.focus()
    await user.keyboard("{Enter}")

    expect(await screen.findByText("Child")).toBeInTheDocument()
    expect(loadChildren).toHaveBeenCalledTimes(2)
  })

  it("ignores the loader when a node ships static children", async () => {
    const user = userEvent.setup()
    const loadChildren = vi.fn()

    render(
      <Tree
        data={[{ id: "root", label: "Root", children: [{ id: "child", label: "Static" }] }]}
        aria-label="Async"
        loadChildren={loadChildren}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Expand" }))
    expect(loadChildren).not.toHaveBeenCalled()
    expect(screen.getByText("Static")).toBeInTheDocument()
  })
})
