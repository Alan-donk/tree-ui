import type { ReactNode } from "react"

/**
 * A single node in the tree.
 *
 * `children` is optional. When omitted and `loadChildren` is provided the node
 * becomes an async node: children are fetched the first time it is expanded.
 */
export interface TreeNode {
  /** Stable, unique identifier. Used for expansion, selection and focus. */
  id: string
  /** Visible label. String labels also power typeahead. */
  label: ReactNode
  children?: TreeNode[]
  disabled?: boolean
  icon?: ReactNode
  /** Plain text used for typeahead when `label` is not a string. */
  searchText?: string
  /** Arbitrary payload, passed back through render slots. */
  data?: unknown
}

export type SelectionMode = "none" | "single" | "multiple"

/** A node flattened into the currently visible order. */
export interface FlatNode {
  id: string
  node: TreeNode
  /** 0-based depth. */
  level: number
  parentId: string | null
  /** 1-based position among its siblings. */
  posinset: number
  /** Number of siblings, including this node. */
  setsize: number
  hasChildren: boolean
}

/** Context passed to the `renderIcon` / `renderActions` slots. */
export interface TreeRenderContext {
  level: number
  isExpanded: boolean
  isSelected: boolean
  isFocused: boolean
}

/** Copy used by the built-in loading, retry and empty affordances. */
export interface TreeMessages {
  loading: string
  loadFailed: string
  retry: string
  empty: string
  noMatches: string
  expand: string
  collapse: string
}
