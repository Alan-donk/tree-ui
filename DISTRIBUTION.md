# Distribution log & copy

Status of every channel we tried, and the copy that goes with it. Keep this file
honest: if a submission is rejected, write why.

| Channel | Status | Action / link |
| --- | --- | --- |
| awesome-shadcn/ui (Registries) | PR open | [#752](https://github.com/birobirobiro/awesome-shadcn-ui/pull/752) |
| 21st.dev | not submitted | <https://21st.dev/publish> (needs an account) — copy below |
| shadcn registry directory (namespace) | not eligible yet | needs a **flat** registry at `/registry.json` with no `content` field; see below |
| npm | not published | `npm login` then `npm publish` (dry run: `npm run package:check`) |
| X / Twitter | draft | copy below |
| Reddit (r/reactjs) | draft | copy below |
| Hacker News (Show HN) | draft | copy below |
| V2EX / 掘金 | draft | link the ZH article |

## 21st.dev submission fields

- **Name:** tree-ui
- **Registry URL:** `https://alan-donk.github.io/tree-ui/r/tree.json`
- **Repository:** `https://github.com/Alan-donk/tree-ui`
- **License:** MIT
- **Pricing:** free
- **Category:** Components / Trees
- **Description:** Accessible, zero-dependency tree view for shadcn/ui with windowing for 10k+ rows, label filtering, async children and a full WAI-ARIA keyboard model.
- **Tags:** tree, tree-view, file-tree, accessibility, virtualization, shadcn

Steps: sign in at <https://21st.dev/publish> → "Add component/registry" → paste the
registry URL → paste the fields above → submit for review.

## shadcn registry directory (optional, later)

`ui.shadcn.com/docs/directory` explains that a namespaced registry (`@tree-ui/tree`)
requires an entry in `apps/v4/registry/directory.json` plus `pnpm validate:registries`,
and the registry itself must be **flat** (`/registry.json` + `/component-name.json`)
with **no `content` field** in `files`.

Our artifact is the opposite shape on purpose: one self-contained
`r/tree.json` with inlined source, so `npx shadcn add <url>` works without a
namespace. Installing by URL is supported today; the namespace is a later, separate
piece of work (serve a second, content-less registry at the site root).

## X / Twitter

> shadcn/ui has no tree view. So I built one:
>
> – virtualized: 10k+ rows, ~20 in the DOM
> – filter with ancestor auto-expand + highlight
> – async children + retry
> – full WAI-ARIA treeview keyboard model
> – zero runtime deps, 3 copy-paste files
>
> npx shadcn@latest add https://alan-donk.github.io/tree-ui/r/tree.json
>
> demo: https://alan-donk.github.io/tree-ui/

## Reddit (r/reactjs)

**Title:** I built a shadcn-native tree view that survives 10k rows (zero deps, async + filter)

**Body:**

I kept hitting the same wall: shadcn/ui has 65 components and no tree, and the
existing community trees don't do async children or windowing without another
dependency.

So I wrote one with three constraints: zero runtime dependencies, installable as
editable source via the shadcn CLI, and a real WAI-ARIA treeview (roving tabindex,
full keyboard model, axe in tests).

What's in v0.2.0:

- fixed-height windowing: 10k+ rows, ~20 mounted, `aria-posinset`/`aria-setsize`
  still describe the full tree
- `filter` that is view-only — ancestors auto-open, matches highlight, and your
  expansion/selection state comes back when you clear it
- async children with per-node cache, retry and polite live-region announcements
- single/multiple selection, Cmd/Ctrl toggles, Shift ranges, disabled nodes

Demo (2,080 rows live): https://alan-donk.github.io/tree-ui/
Source (MIT): https://github.com/Alan-donk/tree-ui

Install: `npx shadcn@latest add https://alan-donk.github.io/tree-ui/r/tree.json`

Feedback on the API shape or the virtualization approach is very welcome — the
roadmap is drag-and-drop and tri-state checkboxes, and I'd rather hear which one
people actually need.

## Hacker News (Show HN)

**Title:** Show HN: A shadcn-native tree view that handles 10k rows

**Body:** shadcn/ui doesn't ship a tree view, and the community ones I found don't
handle async children or large trees without extra dependencies. I built one that
keeps the component dependency-free: one flat visible-node array powers keyboard
nav, typeahead, windowing and ARIA; the filter is a pure view over the data; async
children cache per node and retry. Install is `npx shadcn@latest add <url>`, so you
own the three files. Happy to talk about the virtualized-focus problem specifically
— it's the part that took the longest.

## Article

- English: [article/en.md](./article/en.md)
- 中文：[article/zh-CN.md](./article/zh-CN.md)

Suggested venues: Dev.to / Hashnode for EN; 掘金 / V2EX / 少数派 for ZH; link the
article from the PR description only if the maintainer asks for context (the list
rules say one link per row, so don't add it to the row).
