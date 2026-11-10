# Changelog

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
