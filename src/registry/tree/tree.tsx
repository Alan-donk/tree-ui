import * as React from "react"

import {
  DEFAULT_MESSAGES,
  useTree,
  type TreeController,
} from "./use-tree"
import type { FlatNode, SelectionMode, TreeNode, TreeMessages, TreeRenderContext } from "./types"

export type { FlatNode, SelectionMode, TreeNode, TreeMessages, TreeRenderContext }

export interface TreeProps {
  /** Root nodes. Each node needs a stable and unique `id`. */
  data: TreeNode[]
  /** Accessible name for the tree. Required so every tree is announced. */
  "aria-label": string
  selectionMode?: SelectionMode
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

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ")
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
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
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
            className={cx(
              "size-3.5 motion-safe:transition-transform",
              expanded && "rotate-90",
            )}
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

      <span className="min-w-0 flex-1 truncate">{node.label}</span>

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
 * Accessible tree view with roving tabindex, typeahead, multi-select and async
 * children. Styling uses shadcn/ui CSS variables, so it inherits your theme.
 */
export function Tree({
  data,
  "aria-label": ariaLabel,
  selectionMode = "single",
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
  const rowsRef = React.useRef(new Map<string, HTMLDivElement>())
  const lastFocusedRef = React.useRef<string | null>(null)

  const registerRow = React.useCallback((id: string, element: HTMLDivElement | null) => {
    if (element) rowsRef.current.set(id, element)
    else rowsRef.current.delete(id)
  }, [])

  // Move DOM focus with the roving tabindex, but never steal it from outside.
  React.useEffect(() => {
    const id = controller.focusedId
    if (!id || id === lastFocusedRef.current) return
    lastFocusedRef.current = id
    const root = treeRef.current
    const row = rowsRef.current.get(id)
    if (!root || !row) return
    const active = document.activeElement
    if (active instanceof Node && root.contains(active)) {
      row.focus({ preventScroll: true })
    }
  }, [controller.focusedId])

  const rovingId = controller.focusedId ?? controller.visible[0]?.id ?? null
  const isEmpty = controller.visible.length === 0

  return (
    <div className={cx("w-full", className)}>
      {isEmpty ? (
        <div className="px-2 py-6 text-center text-sm text-muted-foreground">
          {renderEmpty ? renderEmpty() : messages.empty}
        </div>
      ) : (
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
          {controller.visible.map((item) => (
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
      )}

      <div role="status" aria-live="polite" className="sr-only">
        {controller.announcement}
      </div>
    </div>
  )
}
