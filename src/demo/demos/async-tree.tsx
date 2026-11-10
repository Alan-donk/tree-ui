import * as React from "react"

import { Badge } from "@/demo/components/ui"
import { asyncTree, loadAsyncChildren, resetAsyncDemo } from "@/demo/data"
import { Tree } from "@/registry/tree/tree"

export function AsyncTree() {
  const [errors, setErrors] = React.useState(0)

  React.useEffect(() => resetAsyncDemo(), [])

  return (
    <div className="space-y-3">
      <Tree
        data={asyncTree}
        aria-label="Workspace packages"
        selectionMode="none"
        loadChildren={loadAsyncChildren}
        onLoadError={() => setErrors((count) => count + 1)}
      />
      <p className="text-xs text-muted-foreground">
        The apps node fails its first request on purpose — press <Badge>Retry</Badge> or focus it and
        hit <Badge>Enter</Badge> to try again.
        {errors > 0 ? ` Failures so far: ${errors}.` : null}
      </p>
    </div>
  )
}
