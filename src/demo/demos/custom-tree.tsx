import * as React from "react"

import { Badge } from "@/demo/components/ui"
import { CodeFileIcon, FileIcon, FolderIcon, FolderOpenIcon } from "@/demo/components/icons"
import { fileTree } from "@/demo/data"
import { Tree, type TreeNode, type TreeRenderContext } from "@/registry/tree/tree"

const iconClassName = "size-4"

function iconFor(node: TreeNode, ctx: TreeRenderContext): React.ReactNode {
  if (node.children) {
    return ctx.isExpanded ? (
      <FolderOpenIcon className={iconClassName} />
    ) : (
      <FolderIcon className={iconClassName} />
    )
  }
  if (/\.(tsx?|jsx?)$/.test(node.id)) return <CodeFileIcon className={iconClassName} />
  return <FileIcon className={iconClassName} />
}

function actionsFor(node: TreeNode): React.ReactNode {
  if (node.id === "src/components/tree.tsx") return <Badge>new</Badge>
  if (node.id === "public/llms.txt") return <Badge>agent</Badge>
  return null
}

export function CustomTree() {
  const [pinned, setPinned] = React.useState<string[]>([])

  return (
    <div className="space-y-3">
      <Tree
        data={fileTree}
        aria-label="Files with custom icons"
        indent={20}
        defaultExpandedIds={["src", "src/components", "public"]}
        renderIcon={iconFor}
        renderActions={(node) => (
          <span className="flex items-center gap-1.5">
            {actionsFor(node)}
            <button
              type="button"
              tabIndex={-1}
              aria-label={`Pin ${node.id}`}
              aria-pressed={pinned.includes(node.id)}
              className="rounded-sm p-0.5 text-muted-foreground opacity-0 transition-opacity group-hover/tree-row:opacity-100 hover:text-foreground focus-visible:opacity-100"
              onClick={(event) => {
                event.stopPropagation()
                setPinned((prev) =>
                  prev.includes(node.id) ? prev.filter((id) => id !== node.id) : [...prev, node.id],
                )
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-3.5">
                <path
                  d="M12 3v10m0 0 3 3m-3-3-3 3M5 19h14"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </span>
        )}
      />
      <p className="text-xs text-muted-foreground">
        Pinned: {pinned.length === 0 ? "nothing yet" : pinned.map((id) => id.split("/").at(-1)).join(", ")}
      </p>
    </div>
  )
}
