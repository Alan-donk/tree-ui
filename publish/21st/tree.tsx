// tree-ui — generated single-file build for 21st.dev.
// Do not edit by hand: run `npm run build:21st` in the tree-ui repository.

import * as React from "react"
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

export const DEFAULT_MESSAGES: TreeMessages = {
  loading: "Loading…",
  loadFailed: "Couldn't load children.",
  retry: "Retry",
  empty: "No items",
  noMatches: "No matching items",
  expand: "Expand",
  collapse: "Collapse",
}

export interface UseTreeOptions {
  data: TreeNode[]
  selectionMode: SelectionMode
  messages: TreeMessages
  filter?: string
  expandedIds?: string[]
  defaultExpandedIds?: string[]
  onExpandedChange?: (ids: string[]) => void
  selectedIds?: string[]
  defaultSelectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  loadChildren?: (node: TreeNode) => Promise<TreeNode[]>
  onLoadError?: (node: TreeNode, error: unknown) => void
}

export interface TreeController {
  visible: FlatNode[]
  expandedSet: Set<string>
  selectedSet: Set<string>
  focusedId: string | null
  loadingIds: Set<string>
  errorIds: Set<string>
  announcement: string
  isExpanded: (id: string) => boolean
  isSelected: (id: string) => boolean
  toggleExpanded: (node: TreeNode) => void
  expandSiblings: (node: TreeNode) => void
  retryLoad: (node: TreeNode) => void
  handleKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void
  handleFocusIn: (event: React.FocusEvent<HTMLDivElement>) => void
  handleRowClick: (event: React.MouseEvent<HTMLDivElement>, node: TreeNode) => void
  handleRowDoubleClick: (node: TreeNode) => void
}

function textOf(node: TreeNode): string {
  if (node.searchText !== undefined) return node.searchText.toLowerCase()
  return typeof node.label === "string" ? node.label.toLowerCase() : ""
}

function containsId(node: TreeNode, id: string, getChildren: (n: TreeNode) => TreeNode[]): boolean {
  for (const child of getChildren(node)) {
    if (child.id === id) return true
    if (containsId(child, id, getChildren)) return true
  }
  return false
}

export function useTree(options: UseTreeOptions): TreeController {
  const {
    data,
    selectionMode,
    messages,
    filter,
    expandedIds,
    defaultExpandedIds,
    onExpandedChange,
    selectedIds,
    defaultSelectedIds,
    onSelectionChange,
    loadChildren,
    onLoadError,
  } = options

  const [expandedInternal, setExpandedInternal] = React.useState<Set<string>>(
    () => new Set(defaultExpandedIds ?? []),
  )
  const [selectedInternal, setSelectedInternal] = React.useState<Set<string>>(
    () => new Set(defaultSelectedIds ?? []),
  )
  const [focusedRaw, setFocusedIdState] = React.useState<string | null>(null)
  const [asyncChildren, setAsyncChildren] = React.useState<Map<string, TreeNode[]>>(() => new Map())
  const [loadingIds, setLoadingIds] = React.useState<Set<string>>(() => new Set())
  const [errorIds, setErrorIds] = React.useState<Set<string>>(() => new Set())
  const [announcement, setAnnouncement] = React.useState("")

  // All ids that currently exist, including async children.
  const allIds = React.useMemo(() => {
    const ids = new Set<string>()
    const stack = [...data]
    while (stack.length > 0) {
      const node = stack.pop()
      if (!node) continue
      ids.add(node.id)
      const children = asyncChildren.get(node.id) ?? node.children
      if (children) stack.push(...children)
    }
    return ids
  }, [data, asyncChildren])

  // Stale ids are ignored instead of being written back, so removing a node from
  // `data` never causes an extra render pass.
  const expandedSet = React.useMemo(() => {
    const base = expandedIds ? new Set(expandedIds) : expandedInternal
    const next = new Set<string>()
    for (const id of base) if (allIds.has(id)) next.add(id)
    return next
  }, [expandedIds, expandedInternal, allIds])
  const selectedSet = React.useMemo(() => {
    const base = selectedIds ? new Set(selectedIds) : selectedInternal
    const next = new Set<string>()
    for (const id of base) if (allIds.has(id)) next.add(id)
    return next
  }, [selectedIds, selectedInternal, allIds])

  const inflightRef = React.useRef(new Set<string>())
  const cancelledRef = React.useRef(false)
  const typeaheadRef = React.useRef<{ buffer: string; timer: ReturnType<typeof setTimeout> | null }>({
    buffer: "",
    timer: null,
  })
  const anchorRef = React.useRef<string | null>(null)
  const mountedRef = React.useRef(false)
  const asyncChildrenRef = React.useRef(asyncChildren)
  const visibleRef = React.useRef<FlatNode[]>([])
  const focusedRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    mountedRef.current = true
    const typeahead = typeaheadRef.current
    return () => {
      mountedRef.current = false
      cancelledRef.current = true
      if (typeahead.timer) clearTimeout(typeahead.timer)
    }
  }, [])

  React.useEffect(() => {
    asyncChildrenRef.current = asyncChildren
  }, [asyncChildren])

  const getChildren = React.useCallback(
    (node: TreeNode): TreeNode[] => asyncChildren.get(node.id) ?? node.children ?? [],
    [asyncChildren],
  )

  const hasChildren = React.useCallback(
    (node: TreeNode): boolean => {
      if ((asyncChildren.get(node.id) ?? node.children ?? []).length > 0) return true
      if (node.children !== undefined) return false
      return loadChildren !== undefined && !asyncChildren.has(node.id)
    },
    [asyncChildren, loadChildren],
  )

  const filterQuery = filter?.trim().toLowerCase() ?? ""
  /**
   * Filtering is view-only: it never mutates expansion or selection. Ancestors of
   * a match are force-expanded so the match is always reachable, and non-matching
   * branches are dropped from the rendered tree.
   */
  const filtered = React.useMemo(() => {
    if (!filterQuery) return null
    const matchedIds = new Set<string>()
    const autoExpanded = new Set<string>()
    const build = (nodes: TreeNode[]): TreeNode[] => {
      const out: TreeNode[] = []
      for (const node of nodes) {
        const own = textOf(node).includes(filterQuery)
        const children = build(getChildren(node))
        if (own) matchedIds.add(node.id)
        if (!own && children.length === 0) continue
        autoExpanded.add(node.id)
        out.push({ ...node, children })
      }
      return out
    }
    return { nodes: build(data), matchedIds, autoExpanded }
  }, [data, filterQuery, getChildren])

  const expandedEffective = React.useMemo(
    () => (filtered ? new Set([...expandedSet, ...filtered.autoExpanded]) : expandedSet),
    [expandedSet, filtered],
  )

  const visible = React.useMemo(() => {
    const roots = filtered ? filtered.nodes : data
    const childrenOf = filtered ? (node: TreeNode) => node.children ?? [] : getChildren
    const canExpand = filtered ? (node: TreeNode) => childrenOf(node).length > 0 : hasChildren
    const out: FlatNode[] = []
    const stack: { nodes: TreeNode[]; index: number; level: number; parentId: string | null }[] = [
      { nodes: roots, index: 0, level: 0, parentId: null },
    ]
    while (stack.length > 0) {
      const frame = stack[stack.length - 1]
      if (!frame) break
      if (frame.index >= frame.nodes.length) {
        stack.pop()
        continue
      }
      const node = frame.nodes[frame.index]
      frame.index += 1
      if (!node) continue
      const canExpandNode = canExpand(node)
      out.push({
        id: node.id,
        node,
        level: frame.level,
        parentId: frame.parentId,
        posinset: frame.index,
        setsize: frame.nodes.length,
        hasChildren: canExpandNode,
      })
      if (canExpandNode && expandedEffective.has(node.id)) {
        stack.push({
          nodes: childrenOf(node),
          index: 0,
          level: frame.level + 1,
          parentId: node.id,
        })
      }
    }
    return out
  }, [data, expandedEffective, filtered, getChildren, hasChildren])

  // Focus falls back to `null` (and therefore to the first row) when the focused
  // node disappears.
  const focusedId =
    focusedRaw !== null && visible.some((item) => item.id === focusedRaw) ? focusedRaw : null

  React.useEffect(() => {
    visibleRef.current = visible
    focusedRef.current = focusedId
  })

  // Warn once when the component switches between controlled and uncontrolled.
  const controlledRef = React.useRef({
    expanded: expandedIds !== undefined,
    selected: selectedIds !== undefined,
  })
  React.useEffect(() => {
    const next = { expanded: expandedIds !== undefined, selected: selectedIds !== undefined }
    const prev = controlledRef.current
    if (prev.expanded !== next.expanded) {
      console.warn("[tree-ui] Tree switched between controlled and uncontrolled `expandedIds`.")
    }
    if (prev.selected !== next.selected) {
      console.warn("[tree-ui] Tree switched between controlled and uncontrolled `selectedIds`.")
    }
    controlledRef.current = next
  }, [expandedIds, selectedIds])

  // Warn once about duplicate ids.
  React.useEffect(() => {
    const seen = new Set<string>()
    const duplicates = new Set<string>()
    const stack = [...data]
    while (stack.length > 0) {
      const node = stack.pop()
      if (!node) continue
      if (seen.has(node.id)) duplicates.add(node.id)
      seen.add(node.id)
      if (node.children) stack.push(...node.children)
    }
    if (duplicates.size > 0) {
      console.warn(`[tree-ui] Duplicate node ids detected: ${[...duplicates].join(", ")}`)
    }
  }, [data])

  const commitExpanded = React.useCallback(
    (next: Set<string>) => {
      if (expandedIds === undefined) setExpandedInternal(next)
      onExpandedChange?.([...next])
    },
    [expandedIds, onExpandedChange],
  )

  const commitSelected = React.useCallback(
    (next: Set<string>) => {
      if (selectedIds === undefined) setSelectedInternal(next)
      onSelectionChange?.([...next])
    },
    [selectedIds, onSelectionChange],
  )

  const ensureChildren = React.useCallback(
    (node: TreeNode) => {
      if (!loadChildren) return
      if (node.children !== undefined) return
      if (asyncChildrenRef.current.has(node.id) || inflightRef.current.has(node.id)) return
      inflightRef.current.add(node.id)
      setLoadingIds((prev) => new Set(prev).add(node.id))
      setErrorIds((prev) => {
        if (!prev.has(node.id)) return prev
        const next = new Set(prev)
        next.delete(node.id)
        return next
      })
      void loadChildren(node)
        .then((children) => {
          inflightRef.current.delete(node.id)
          if (cancelledRef.current || !mountedRef.current) return
          setAsyncChildren((prev) => {
            const next = new Map(prev)
            next.set(node.id, children)
            return next
          })
          setLoadingIds((prev) => {
            const copy = new Set(prev)
            copy.delete(node.id)
            return copy
          })
        })
        .catch((error: unknown) => {
          inflightRef.current.delete(node.id)
          if (cancelledRef.current || !mountedRef.current) return
          setLoadingIds((prev) => {
            const copy = new Set(prev)
            copy.delete(node.id)
            return copy
          })
          setErrorIds((prev) => new Set(prev).add(node.id))
          setAnnouncement(`${messages.loadFailed} ${messages.retry}.`)
          onLoadError?.(node, error)
        })
    },
    [loadChildren, messages.loadFailed, messages.retry, onLoadError],
  )

  const toggleExpanded = React.useCallback(
    (node: TreeNode) => {
      if (node.disabled) return
      const expanded = expandedSet.has(node.id)
      const next = new Set(expandedSet)
      if (expanded) {
        next.delete(node.id)
        const focused = focusedRef.current
        if (focused !== null && focused !== node.id && containsId(node, focused, getChildren)) {
          setFocusedIdState(node.id)
        }
      } else {
        next.add(node.id)
      }
      commitExpanded(next)
      if (!expanded) ensureChildren(node)
    },
    [expandedSet, commitExpanded, ensureChildren, getChildren],
  )

  const expandSiblings = React.useCallback(
    (node: TreeNode) => {
      const item = visibleRef.current.find((entry) => entry.id === node.id)
      if (!item) return
      const next = new Set(expandedSet)
      for (const sibling of visibleRef.current) {
        if (sibling.level === item.level && sibling.parentId === item.parentId && sibling.hasChildren) {
          if (!next.has(sibling.id)) {
            next.add(sibling.id)
            ensureChildren(sibling.node)
          }
        }
      }
      commitExpanded(next)
    },
    [expandedSet, commitExpanded, ensureChildren],
  )

  const retryLoad = React.useCallback(
    (node: TreeNode) => {
      if (!loadChildren) return
      ensureChildren(node)
    },
    [ensureChildren, loadChildren],
  )

  const selectOnly = React.useCallback(
    (node: TreeNode) => {
      if (selectionMode === "none" || node.disabled) return
      anchorRef.current = node.id
      commitSelected(new Set([node.id]))
    },
    [commitSelected, selectionMode],
  )

  const toggleSelection = React.useCallback(
    (node: TreeNode) => {
      if (selectionMode !== "multiple" || node.disabled) return
      const next = new Set(selectedSet)
      if (next.has(node.id)) next.delete(node.id)
      else next.add(node.id)
      anchorRef.current = node.id
      commitSelected(next)
    },
    [commitSelected, selectedSet, selectionMode],
  )

  const selectRange = React.useCallback(
    (node: TreeNode) => {
      if (selectionMode !== "multiple" || node.disabled) return
      const anchor = anchorRef.current
      const list = visibleRef.current
      const from = anchor ? list.findIndex((entry) => entry.id === anchor) : -1
      const to = list.findIndex((entry) => entry.id === node.id)
      if (from < 0 || to < 0) {
        selectOnly(node)
        return
      }
      const start = Math.min(from, to)
      const end = Math.max(from, to)
      const next = new Set(selectedSet)
      for (let index = start; index <= end; index += 1) {
        const entry = list[index]
        if (entry && !entry.node.disabled) next.add(entry.id)
      }
      anchorRef.current = node.id
      commitSelected(next)
    },
    [commitSelected, selectedSet, selectOnly, selectionMode],
  )

  const isExpanded = React.useCallback((id: string) => expandedEffective.has(id), [expandedEffective])
  const isSelected = React.useCallback((id: string) => selectedSet.has(id), [selectedSet])

  const handleRowClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>, node: TreeNode) => {
      setFocusedIdState(node.id)
      if (node.disabled) return
      if (event.shiftKey && selectionMode === "multiple") {
        event.preventDefault()
        selectRange(node)
        return
      }
      if ((event.metaKey || event.ctrlKey) && selectionMode === "multiple") {
        toggleSelection(node)
        return
      }
      selectOnly(node)
    },
    [selectOnly, selectRange, selectionMode, toggleSelection],
  )

  const handleRowDoubleClick = React.useCallback(
    (node: TreeNode) => {
      if (node.disabled) return
      if (!hasChildren(node)) return
      toggleExpanded(node)
    },
    [hasChildren, toggleExpanded],
  )

  const handleFocusIn = React.useCallback((event: React.FocusEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null
    const row = target?.closest<HTMLElement>("[data-tree-row]")
    const id = row?.dataset.treeRow
    if (id) setFocusedIdState(id)
  }, [])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.defaultPrevented) return
      const list = visibleRef.current
      if (list.length === 0) return
      const currentIndex = focusedRef.current ? list.findIndex((item) => item.id === focusedRef.current) : -1
      const current = currentIndex >= 0 ? list[currentIndex] : undefined

      const moveTo = (index: number) => {
        const target = list[index]
        if (target) setFocusedIdState(target.id)
      }

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault()
          moveTo(currentIndex < 0 ? 0 : currentIndex + 1)
          return
        case "ArrowUp":
          event.preventDefault()
          moveTo(currentIndex < 0 ? 0 : currentIndex - 1)
          return
        case "Home":
          event.preventDefault()
          moveTo(0)
          return
        case "End":
          event.preventDefault()
          moveTo(list.length - 1)
          return
        case "ArrowRight": {
          if (!current) return
          event.preventDefault()
          if (current.hasChildren && !expandedSet.has(current.id)) {
            toggleExpanded(current.node)
          } else if (current.hasChildren) {
            const next = list[currentIndex + 1]
            if (next && next.level > current.level) setFocusedIdState(next.id)
          }
          return
        }
        case "ArrowLeft": {
          if (!current) return
          event.preventDefault()
          if (current.hasChildren && expandedSet.has(current.id)) {
            toggleExpanded(current.node)
          } else if (current.parentId) {
            setFocusedIdState(current.parentId)
          }
          return
        }
        case "Enter":
        case " ": {
          if (!current) return
          event.preventDefault()
          if (errorIds.has(current.id)) {
            retryLoad(current.node)
            return
          }
          if (selectionMode === "none") {
            if (current.hasChildren) toggleExpanded(current.node)
            return
          }
          selectOnly(current.node)
          return
        }
        case "*": {
          if (!current) return
          event.preventDefault()
          expandSiblings(current.node)
          return
        }
        default:
          break
      }

      const isPrintable =
        event.key.length === 1 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !/^\s$/.test(event.key)
      if (!isPrintable) return

      const typeahead = typeaheadRef.current
      typeahead.buffer += event.key.toLowerCase()
      if (typeahead.timer) clearTimeout(typeahead.timer)
      typeahead.timer = setTimeout(() => {
        typeahead.buffer = ""
        typeahead.timer = null
      }, 600)

      const buffer = typeahead.buffer
      const total = list.length
      for (let offset = 1; offset <= total; offset += 1) {
        const entry = list[(currentIndex + offset) % total]
        if (!entry || entry.node.disabled) continue
        if (textOf(entry.node).startsWith(buffer)) {
          event.preventDefault()
          setFocusedIdState(entry.id)
          return
        }
      }
    },
    [errorIds, expandedSet, expandSiblings, retryLoad, selectOnly, selectionMode, toggleExpanded],
  )

  return {
    visible,
    expandedSet,
    selectedSet,
    focusedId,
    loadingIds,
    errorIds,
    announcement,
    isExpanded,
    isSelected,
    toggleExpanded,
    expandSiblings,
    retryLoad,
    handleKeyDown,
    handleFocusIn,
    handleRowClick,
    handleRowDoubleClick,
  }
}

export interface TreeProps {
  /** Root nodes. Each node needs a stable and unique `id`. */
  data: TreeNode[]
  /** Accessible name for the tree. Required so every tree is announced. */
  "aria-label": string
  selectionMode?: SelectionMode
  /** Case-insensitive substring filter over labels / `searchText`. View-only. */
  filter?: string
  /** Fixed height in pixels. Enables windowing for very large trees. */
  height?: number
  /** Extra rows rendered above and below the viewport. Defaults to `6`. */
  overscan?: number
  expandedIds?: string[]
  defaultExpandedIds?: string[]
  onExpandedChange?: (ids: string[]) => void
  selectedIds?: string[]
  defaultSelectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  loadChildren?: (node: TreeNode) => Promise<TreeNode[]>
  onLoadError?: (node: TreeNode, error: unknown) => void
  renderIcon?: (node: TreeNode, ctx: TreeRenderContext) => React.ReactNode
  renderActions?: (node: TreeNode, ctx: TreeRenderContext) => React.ReactNode
  renderEmpty?: () => React.ReactNode
  /** Indentation in pixels per level. Defaults to `16`. */
  indent?: number
  messages?: Partial<TreeMessages>
  className?: string
  itemClassName?: string
}

/** Rows are `h-8` (32px); windowing needs a fixed height. */
const ROW_HEIGHT = 32

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ")
}

function highlight(label: React.ReactNode, query: string): React.ReactNode {
  if (!query || typeof label !== "string") return label
  const index = label.toLowerCase().indexOf(query)
  if (index < 0) return label
  return (
    <>
      {label.slice(0, index)}
      <mark className="rounded-sm bg-brand/25 px-0.5 text-foreground">
        {label.slice(index, index + query.length)}
      </mark>
      {label.slice(index + query.length)}
    </>
  )
}

interface TreeRowProps {
  item: FlatNode
  expanded: boolean
  selected: boolean
  focused: boolean
  loading: boolean
  error: boolean
  selectionMode: SelectionMode
  indent: number
  messages: TreeMessages
  query: string
  itemClassName?: string
  registerRow: (id: string, element: HTMLDivElement | null) => void
  onToggle: (node: TreeNode) => void
  onRetry: (node: TreeNode) => void
  onClick: (event: React.MouseEvent<HTMLDivElement>, node: TreeNode) => void
  onDoubleClick: (node: TreeNode) => void
  renderIcon?: TreeProps["renderIcon"]
  renderActions?: TreeProps["renderActions"]
}

function TreeRow({
  item,
  expanded,
  selected,
  focused,
  loading,
  error,
  selectionMode,
  indent,
  messages,
  query,
  itemClassName,
  registerRow,
  onToggle,
  onRetry,
  onClick,
  onDoubleClick,
  renderIcon,
  renderActions,
}: TreeRowProps) {
  const { node } = item
  const context: TreeRenderContext = {
    level: item.level,
    isExpanded: expanded,
    isSelected: selected,
    isFocused: focused,
  }
  const icon = node.icon ?? renderIcon?.(node, context)

  return (
    // Keyboard interaction is implemented once, on the tree container, using a
    // roving tabindex. Rows only need pointer handlers.
    <div
      role="treeitem"
      data-tree-row={node.id}
      data-state={selected ? "selected" : expanded && item.hasChildren ? "open" : "closed"}
      ref={(element) => registerRow(node.id, element)}
      aria-level={item.level + 1}
      aria-posinset={item.posinset}
      aria-setsize={item.setsize}
      aria-label={typeof node.label === "string" ? node.label : undefined}
      aria-expanded={item.hasChildren ? expanded : undefined}
      aria-selected={selectionMode === "none" ? undefined : selected}
      aria-disabled={node.disabled || undefined}
      aria-busy={loading || undefined}
      tabIndex={focused ? 0 : -1}
      className={cx(
        "group/tree-row flex h-8 w-full items-center gap-1.5 rounded-md pe-2 text-start text-sm outline-none",
        "hover:bg-accent/60 motion-safe:transition-colors",
        focused && "ring-1 ring-ring/50 ring-inset",
        selected && "bg-accent text-accent-foreground",
        node.disabled && "pointer-events-none opacity-50",
        itemClassName,
      )}
      style={{ paddingInlineStart: `${6 + item.level * indent}px` }}
      onClick={(event) => onClick(event, node)}
      onDoubleClick={() => onDoubleClick(node)}
    >
      {item.hasChildren ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label={expanded ? messages.collapse : messages.expand}
          className="flex size-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={(event) => {
            event.stopPropagation()
            onToggle(node)
          }}
          onDoubleClick={(event) => event.stopPropagation()}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className={cx("size-3.5 motion-safe:transition-transform", expanded && "rotate-90")}
          >
            <path
              d="M9 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : (
        <span aria-hidden="true" className="size-4 shrink-0" />
      )}

      {icon ? <span className="flex shrink-0 items-center text-muted-foreground">{icon}</span> : null}

      <span className="min-w-0 flex-1 truncate">{highlight(node.label, query)}</span>

      {loading ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="size-3.5 shrink-0 animate-spin text-muted-foreground"
        >
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : null}

      {error && !loading ? (
        <button
          type="button"
          tabIndex={-1}
          className="shrink-0 rounded-sm bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive hover:bg-destructive/20"
          onClick={(event) => {
            event.stopPropagation()
            onRetry(node)
          }}
        >
          {messages.retry}
        </button>
      ) : null}

      {renderActions?.(node, context)}
    </div>
  )
}

/**
 * Accessible tree view with roving tabindex, typeahead, multi-select, filtering,
 * async children and windowed rendering for large trees. Styling uses shadcn/ui
 * CSS variables, so it inherits your theme.
 */
export function Tree({
  data,
  "aria-label": ariaLabel,
  selectionMode = "single",
  filter,
  height,
  overscan = 6,
  expandedIds,
  defaultExpandedIds,
  onExpandedChange,
  selectedIds,
  defaultSelectedIds,
  onSelectionChange,
  loadChildren,
  onLoadError,
  renderIcon,
  renderActions,
  renderEmpty,
  indent = 16,
  messages: messagesProp,
  className,
  itemClassName,
}: TreeProps) {
  const messages = React.useMemo<TreeMessages>(
    () => ({ ...DEFAULT_MESSAGES, ...messagesProp }),
    [messagesProp],
  )

  const controller: TreeController = useTree({
    data,
    selectionMode,
    messages,
    filter,
    expandedIds,
    defaultExpandedIds,
    onExpandedChange,
    selectedIds,
    defaultSelectedIds,
    onSelectionChange,
    loadChildren,
    onLoadError,
  })

  const treeRef = React.useRef<HTMLDivElement | null>(null)
  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  const rowsRef = React.useRef(new Map<string, HTMLDivElement>())
  const lastFocusedRef = React.useRef<string | null>(null)

  const virtual = typeof height === "number" && height > 0
  const query = filter?.trim().toLowerCase() ?? ""
  const [scrollTop, setScrollTop] = React.useState(0)
  const [measuredHeight, setMeasuredHeight] = React.useState(0)
  const viewport = measuredHeight || (typeof height === "number" ? height : 0)

  const registerRow = React.useCallback((id: string, element: HTMLDivElement | null) => {
    if (element) rowsRef.current.set(id, element)
    else rowsRef.current.delete(id)
  }, [])

  // Measure the scroll viewport so windowing does not depend on `height` alone.
  React.useEffect(() => {
    const element = scrollRef.current
    if (!element || !virtual) return
    const measure = () => setMeasuredHeight(element.clientHeight)
    measure()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [virtual])

  const total = controller.visible.length
  const windowed = React.useMemo(() => {
    if (!virtual) return { start: 0, end: total }
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - overscan)
    const end = Math.min(total, Math.ceil((scrollTop + viewport) / ROW_HEIGHT) + overscan)
    return { start, end }
  }, [virtual, total, scrollTop, viewport, overscan])

  const rows =
    windowed.start === 0 && windowed.end === total
      ? controller.visible
      : controller.visible.slice(windowed.start, windowed.end)

  // Move DOM focus with the roving tabindex. With windowing on, the target row may
  // not be mounted yet, so scroll it into the window and retry on the next frame.
  // Never steal focus from outside the tree.
  React.useEffect(() => {
    const id = controller.focusedId
    if (!id || id === lastFocusedRef.current) return
    lastFocusedRef.current = id

    const root = treeRef.current
    const active = document.activeElement
    const wasInside = active instanceof Node && root?.contains(active) === true

    if (virtual) {
      const scroll = scrollRef.current
      const index = controller.visible.findIndex((item) => item.id === id)
      if (scroll && index >= 0) {
        const top = index * ROW_HEIGHT
        const viewportPx = viewport || scroll.clientHeight
        if (top < scroll.scrollTop || top + ROW_HEIGHT > scroll.scrollTop + viewportPx) {
          scroll.scrollTop = Math.max(0, top + ROW_HEIGHT - viewportPx)
          // The window is derived from scroll state; keep the two in sync.
          setScrollTop(scroll.scrollTop)
        }
      }
    }

    if (!wasInside) return

    const attemptFocus = (tries: number) => {
      const row = rowsRef.current.get(id)
      if (row) {
        row.focus({ preventScroll: true })
        return
      }
      if (tries >= 3) return
      const schedule =
        typeof requestAnimationFrame === "function"
          ? requestAnimationFrame
          : (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0)
      schedule(() => attemptFocus(tries + 1))
    }

    attemptFocus(0)
  }, [controller.focusedId, controller.visible, virtual, viewport])

  const rovingId = controller.focusedId ?? controller.visible[0]?.id ?? null
  const isEmpty = controller.visible.length === 0
  const emptyContent = renderEmpty ? renderEmpty() : query ? messages.noMatches : messages.empty

  return (
    <div className={cx("w-full", className)}>
      {isEmpty ? (
        <div className="px-2 py-6 text-center text-sm text-muted-foreground">{emptyContent}</div>
      ) : (
        <div
          ref={scrollRef}
          data-tree-scroll={virtual ? "" : undefined}
          style={virtual ? { height } : undefined}
          className={virtual ? "relative overflow-auto pe-1" : undefined}
          onScroll={
            virtual
              ? (event) => setScrollTop(event.currentTarget.scrollTop)
              : undefined
          }
        >
          <div
            style={
              virtual
                ? {
                    paddingTop: windowed.start * ROW_HEIGHT,
                    paddingBottom: (total - windowed.end) * ROW_HEIGHT,
                  }
                : undefined
            }
          >
            <div
              ref={treeRef}
              role="tree"
              aria-label={ariaLabel}
              aria-multiselectable={selectionMode === "multiple" ? true : undefined}
              tabIndex={-1}
              className="outline-none"
              onKeyDown={controller.handleKeyDown}
              onFocus={controller.handleFocusIn}
            >
              {rows.map((item) => (
                <TreeRow
                  key={item.id}
                  item={item}
                  expanded={controller.isExpanded(item.id)}
                  selected={controller.isSelected(item.id)}
                  focused={controller.focusedId !== null && rovingId === item.id}
                  loading={controller.loadingIds.has(item.id)}
                  error={controller.errorIds.has(item.id)}
                  selectionMode={selectionMode}
                  indent={indent}
                  messages={messages}
                  query={query}
                  itemClassName={itemClassName}
                  registerRow={registerRow}
                  onToggle={controller.toggleExpanded}
                  onRetry={controller.retryLoad}
                  onClick={controller.handleRowClick}
                  onDoubleClick={controller.handleRowDoubleClick}
                  renderIcon={renderIcon}
                  renderActions={renderActions}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div role="status" aria-live="polite" className="sr-only">
        {controller.announcement}
      </div>
    </div>
  )
}

export default Tree
