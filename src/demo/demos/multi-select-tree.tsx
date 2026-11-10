import * as React from "react"

import { Badge } from "@/demo/components/ui"
import { orgTree } from "@/demo/data"
import { Tree } from "@/registry/tree/tree"

export function MultiSelectTree() {
  const [selected, setSelected] = React.useState<string[]>([
    "engineering/platform/data",
    "design/systems",
  ])

  return (
    <div className="space-y-3">
      <Tree
        data={orgTree}
        aria-label="Teams"
        selectionMode="multiple"
        defaultExpandedIds={["engineering", "engineering/platform"]}
        selectedIds={selected}
        onSelectionChange={setSelected}
      />
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span>Selected {selected.length}</span>
        {selected.map((id) => (
          <Badge key={id} className="font-mono">
            {id.split("/").at(-1)}
          </Badge>
        ))}
        {selected.length === 0 ? <span>— try ⌘/Ctrl-click or Shift-click</span> : null}
      </div>
    </div>
  )
}
