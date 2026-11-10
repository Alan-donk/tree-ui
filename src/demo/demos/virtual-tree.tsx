import * as React from "react"

import { Badge } from "@/demo/components/ui"
import { createLargeTree } from "@/demo/data"
import { Tree } from "@/registry/tree/tree"

export function VirtualTree() {
  const data = React.useMemo(() => createLargeTree(), [])
  const folderIds = React.useMemo(() => data.map((node) => node.id), [data])
  const [query, setQuery] = React.useState("")

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter 2,080 nodes by file name…"
          aria-label="Filter files"
          className="h-8 w-full rounded-md border border-border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Badge className="shrink-0 font-mono">{query ? "filtered" : "2,080 rows"}</Badge>
      </div>
      <Tree
        data={data}
        aria-label="Package files"
        height={288}
        defaultExpandedIds={folderIds}
        filter={query}
      />
      <p className="text-xs text-muted-foreground">
        2,080 rows exist, but only the ~16 visible ones are in the DOM. Use End / Home / typeahead to
        jump, then filter by file name — ancestors open automatically and matches are highlighted.
      </p>
    </div>
  )
}
