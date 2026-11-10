import * as React from "react"

import { Tree, type TreeNode } from "./tree"

const data: TreeNode[] = [
  {
    id: "src",
    label: "src",
    children: [
      {
        id: "src/components",
        label: "components",
        children: [
          { id: "src/components/tree.tsx", label: "tree.tsx" },
          { id: "src/components/use-tree.ts", label: "use-tree.ts" },
          { id: "src/components/types.ts", label: "types.ts" },
        ],
      },
      {
        id: "src/demo",
        label: "demo",
        children: [
          { id: "src/demo/app.tsx", label: "app.tsx" },
          { id: "src/demo/main.tsx", label: "main.tsx" },
        ],
      },
      { id: "src/index.ts", label: "index.ts" },
    ],
  },
  {
    id: "public",
    label: "public",
    children: [
      { id: "public/favicon.svg", label: "favicon.svg" },
      { id: "public/llms.txt", label: "llms.txt" },
    ],
  },
  { id: "package.json", label: "package.json" },
  { id: "README.md", label: "README.md" },
]

export default function Demo() {
  const [selected, setSelected] = React.useState<string[]>(["src/components/tree.tsx"])

  return (
    <div className="flex w-full justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-3 text-card-foreground shadow-sm">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-sm font-medium">Project files</p>
          <span className="font-mono text-[11px] text-muted-foreground">tree-ui</span>
        </div>
        <Tree
          data={data}
          aria-label="Project files"
          defaultExpandedIds={["src", "src/components"]}
          selectedIds={selected}
          onSelectionChange={setSelected}
        />
        <p className="mt-2 px-1 font-mono text-[11px] text-muted-foreground">
          {selected[0] ?? "nothing selected"}
        </p>
      </div>
    </div>
  )
}
