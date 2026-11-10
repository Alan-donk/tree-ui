# Changelog

## 0.2.0

Large-tree release.

- **Windowing**: pass `height` and only the visible rows (plus `overscan`) are
  mounted. Keyboard navigation, Home/End and typeahead keep the active row in view;
  `aria-posinset` / `aria-setsize` still describe the whole tree.
- **Filtering**: `filter` does a case-insensitive match over labels and
  `searchText`, force-opens ancestors of matches, highlights the matched substring
  and leaves expansion/selection untouched when cleared. Adds a `noMatches` message.
- **npm package**: `@alan-donk/tree-ui` build (`dist-lib/`, ESM + d.ts) with an
  `exports` map, `files` allowlist and `package:check` covering `npm pack`.
- Demo: new 2,080-row virtualized + filterable example, refreshed screenshots.
- Tests: 40 total (13 new for filtering and windowing).

## 0.1.0

Initial release.

- Data-driven `Tree` component with `role="tree"` / `role="treeitem"` markup,
  roving tabindex and the full WAI-ARIA treeview keyboard model.
- Single, multiple and disabled selection; Cmd/Ctrl toggling and Shift ranges.
- Async children via `loadChildren`, cached per node, with busy state,
  live-region announcements and retry (button or Enter).
- Icon, action and empty-state render slots; `messages` for copy; `indent`,
  `className` and `itemClassName` class hooks.
- shadcn registry output at `r/tree.json` with inlined sources, plus
  `llms.txt` for coding agents.
- Demo site with four live examples, API table and accessibility notes.
- CI (lint, typecheck, tests, build, registry checks) and GitHub Pages deploy.
