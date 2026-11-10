import * as React from "react"

import { fileTree } from "@/demo/data"
import { Badge } from "@/demo/components/ui"
import { Tree } from "@/registry/tree/tree"

export function BasicTree() {
  const [selected, setSelected] = React.useState<string[]>([])

  return (
    <div className="space-y-3">
      <Tree
        data={fileTree}
        aria-label="Project files"
        defaultExpandedIds={["src", "src/components"]}
        defaultSelectedIds={["src/components/tree.tsx"]}
        onSelectionChange={setSelected}
      />
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        Selected
        <Badge className="font-mono">{selected[0] ?? "none"}</Badge>
      </p>
    </div>
  )
}
