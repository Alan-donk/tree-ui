# tree-ui

> An accessible, zero-dependency tree view for shadcn/ui projects. Install with the
> shadcn CLI and own the three files it writes.

[![tree-ui demo](docs/preview.png)]({{SITE_URL}})

**Live demo:** {{SITE_URL}} · **Registry:** {{REGISTRY_URL}}

## Install

```bash
npx shadcn@latest add {{REGISTRY_URL}}
```

This writes:

- `components/tree/tree.tsx` — the component
- `components/tree/use-tree.ts` — state, keyboard and async logic
- `components/tree/types.ts` — public types

Requirements: React 19 and the default shadcn/ui CSS variables (`bg-accent`,
`ring-ring`, `text-muted-foreground`, …). There are no runtime dependencies.

Manual install: copy `src/registry/tree/*` from the repository into
`components/tree/`.

## Usage

```tsx
import { Tree } from "@/components/tree/tree"

const data = [
  { id: "src", label: "src", children: [{ id: "src/index.ts", label: "index.ts" }] },
]

export function Files() {
  return (
    <Tree
      data={data}
      aria-label="Project files"
      defaultExpandedIds={["src"]}
      onSelectionChange={(ids) => console.log(ids)}
    />
  )
}
```

### Async children

```tsx
<Tree
  data={[{ id: "workspace", label: "workspace" }]}
  aria-label="Workspace"
  loadChildren={async (node) => fetchChildren(node.id)}
  onLoadError={(node, error) => report(node, error)}
/>
```

Children load on first expand, are cached per node id, and failures render a
retry affordance that is also reachable with Enter.

### Multiple selection

```tsx
<Tree data={teams} aria-label="Teams" selectionMode="multiple" selectedIds={ids} onSelectionChange={setIds} />
```

Cmd/Ctrl-click toggles, Shift-click selects the visible range, disabled nodes are
skipped.

![Four live examples: file tree, async children, multi-select and custom slots](docs/examples.png)

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `TreeNode[]` | — | Root nodes; `id` must be unique |
| `aria-label` | `string` | — | Accessible name (required) |
| `selectionMode` | `"none" \| "single" \| "multiple"` | `"single"` | Selection behaviour |
| `expandedIds` | `string[]` | — | Controlled expansion |
| `defaultExpandedIds` | `string[]` | `[]` | Initial expansion |
| `onExpandedChange` | `(ids: string[]) => void` | — | Expansion callback |
| `selectedIds` | `string[]` | — | Controlled selection |
| `defaultSelectedIds` | `string[]` | `[]` | Initial selection |
| `onSelectionChange` | `(ids: string[]) => void` | — | Selection callback |
| `loadChildren` | `(node) => Promise<TreeNode[]>` | — | Async children |
| `onLoadError` | `(node, error) => void` | — | Async failure hook |
| `renderIcon` | `(node, ctx) => ReactNode` | — | Icon slot |
| `renderActions` | `(node, ctx) => ReactNode` | — | Trailing slot |
| `renderEmpty` | `() => ReactNode` | — | Empty state |
| `indent` | `number` | `16` | Pixels per level |
| `messages` | `Partial<TreeMessages>` | — | Copy for loading/retry/chevrons |
| `className` / `itemClassName` | `string` | — | Class hooks |

`TreeNode = { id, label, children?, icon?, disabled?, searchText?, data? }`.

## Keyboard

| Key | Action |
| --- | --- |
| ↑ / ↓ | Previous / next visible node |
| → | Expand, or move to the first child |
| ← | Collapse, or move to the parent |
| Home / End | First / last visible node |
| Enter / Space | Select (toggles expansion when `selectionMode="none"`) |
| `*` | Expand every sibling on the same level |
| a–z, 0–9 | Typeahead |
| Double click | Toggle expansion |

## Accessibility

Implements the WAI-ARIA tree view pattern: a single tab stop with roving focus,
`role="tree"` / `role="treeitem"`, plus `aria-level`, `aria-posinset`,
`aria-setsize`, `aria-expanded`, `aria-selected`, `aria-disabled` and
`aria-busy`. Async failures are announced through a polite live region.
Transitions are `motion-safe` only. Tests include an axe scan of the rendered
tree.

![Keyboard reference and accessibility notes](docs/accessibility.png)

## Development

```bash
npm install
npm run dev        # demo site
npm run screenshot # refresh docs/*.png from the built demo
npm run verify     # lint + typecheck + tests + build + registry checks
```

`npm run screenshot` drives Playwright against `vite preview`. Playwright's
Chromium download is blocked on some networks, so the script falls back to an
installed Chrome or Edge (`PW_CHANNEL=chrome|msedge|chromium` to force one).

Publishing to GitHub: see [PUBLISH.md](./PUBLISH.md) and
[GITHUB-SETUP.md](./GITHUB-SETUP.md).

## Scope

v0.1.0 ships a data-driven tree with async children and multi-select.
Virtualization, drag-and-drop, search highlighting and a Vue port are on the
roadmap — see [CHANGELOG.md](./CHANGELOG.md).

## License

MIT
