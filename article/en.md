# shadcn has no Tree — so I built one that handles 10,000 rows

`shadcn/ui` ships 65 components. There is no tree view. For file explorers, package
browsers, org charts and AI-coding UIs, that is an annoying gap: you either install
`antd`, pull in `react-arborist`, or hand-roll `role="tree"` and hope.

The honest part first: two community tree views already exist with a few hundred
stars each. Both are good at what they do. What neither does is **async children**
and **windowing for very large trees** without another dependency. That is the gap
I went after with [`tree-ui`](https://github.com/Alan-donk/tree-ui).

## The constraints I set

- **Zero runtime dependencies.** No Base UI, no Radix, no headless library. React and
  your Tailwind tokens only, so nothing extra to audit or upgrade.
- **Installable as source.** `npx shadcn@latest add <url>` writes three editable
  files. No npm package lock-in.
- **A real treeview.** WAI-ARIA pattern, roving tabindex, full keyboard model,
  axe scan in tests.
- **10k rows without a virtual list library.** If it needs `react-window`, it isn't
  zero-dependency.

## Design 1: one flat array, computed iteratively

The component never recurses over your data at render time. A single `useMemo`
walks the tree with an explicit stack and produces the visible rows:

```ts
{ id, node, level, parentId, posinset, setsize, hasChildren }
```

That flat array is the source of truth for keyboard navigation, typeahead, range
selection, windowing and ARIA metadata. Ten thousand nodes is one linear pass, and
there is no recursion to blow the stack.

## Design 2: windowing in ~60 lines

Rows are a fixed 32px. Given `scrollTop` and the viewport height, the visible slice
is arithmetic:

```ts
const start = max(0, floor(scrollTop / 32) - overscan)
const end   = min(total, ceil((scrollTop + viewport) / 32) + overscan)
```

Two spacer paddings stand in for the rows that are not mounted. The important
detail: `aria-posinset` and `aria-setsize` are computed from the **full** tree, not
the window, so screen readers still announce "3 of 2,080" even though only ~20 rows
exist in the DOM.

## Design 3: virtualized focus is the hard part

Windowing breaks the roving tabindex model, because the row you want to focus may
not be mounted. The fix that survived testing:

1. keyboard handlers update `focusedId`;
2. an effect measures the target index, scrolls it into the window and mirrors the
   new `scrollTop` into state;
3. on the next frame, the row exists, so focus moves to it.

Home/End, arrow keys and typeahead all go through that path. If focus moves
outside the tree, the effect never steals it back — that guard matters more than
the scrolling itself.

## Design 4: a filter that does not mutate your state

`filter` is a view over the same data. Matching nodes and their ancestors are kept,
ancestors are force-expanded, non-matching branches are dropped, and the matched
substring is wrapped in `<mark>`. The user's expansion and selection sets are
untouched, so clearing the filter restores exactly what they had open before. That
"view-only" property is what made filtering cheap to add after windowing.

## Design 5: async children with retry

`loadChildren` is called on first expand, cached per node id, and failures render a
retry affordance plus a polite live-region announcement. `aria-busy` covers the
loading state. Nothing about it needs a data-fetching library.

## What testing actually looked like

40 Vitest cases, including an axe scan of the rendered tree. Thirteen of them exist
only because of the new features: filter ancestor expansion, highlight, state
restore, window size, scroll-triggered windowing, keyboard focus into unmounted
rows. The registry artifact is installed into a scratch project and type-checked on
its own, and the npm build is packed and smoke-imported. That is the part that
turns "works on my machine" into "works from the registry".

## Size

- 3 source files, ~36 kB of inlined JSON in the registry.
- npm build: ESM + `.d.ts`, **15 kB** tarball, no runtime dependencies.
- 40 tests, 6 files.

## Try it

```bash
npx shadcn@latest add https://alan-donk.github.io/tree-ui/r/tree.json
```

Live demo with a 2,080-row tree, filtering, async loading and multi-select:
<https://alan-donk.github.io/tree-ui/>

## What it is not

Not a data grid. No drag-and-drop yet, no column alignment, no tri-state
checkboxes. Those belong in issues, not in a v0.2.0 that pretends to be a platform.
The point of shipping small is that the next feature can be argued about with real
users instead of guesses.

If the tree view you need is "shadcn-native, keyboard-complete and survives a big
repo", this is for you. If you need drag-and-drop today, one of the older libraries
is the better call — and that is fine.
