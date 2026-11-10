# Publishing tree-ui to 21st.dev

21st publishes **component source + a demo**, not a registry URL. That is why this
folder exists: `tree.tsx` is a generated single-file build of the three registry
files, and `default.tsx` is the demo it publishes with.

Regenerate the bundle after editing `src/registry/tree/`:

```bash
npm run build:21st
```

## Publish (CLI, recommended)

```bash
npm i -g @21st-dev/cli
21st login
21st publish ./publish/21st/tree.tsx \
  --demo ./publish/21st/default.tsx \
  --description "Accessible, zero-dependency tree view with windowing for 10k+ rows, label filtering, async children and a full WAI-ARIA keyboard model." \
  --tags tree,tree-view,accessibility,virtualization \
  --registry ui \
  --website https://alan-donk.github.io/tree-ui/
```

Studio opens in CLI Review: check the live demo, wait for the generated cover
(or attach one with `--preview`), then publish. `21st submit <slug>` puts it in
the catalog afterwards.

## Publish (Studio, no CLI)

In the 21st Studio screen the sources are laid out as:

```
src/components/ui/tree.tsx   ← publish/21st/tree.tsx
src/demos/default.tsx        ← publish/21st/default.tsx
```

Add one or two tags and a cover image for the demo, then publish.

## Notes

- The bundle stays dependency-free; the demo only imports `./tree`.
- Keep `default.tsx` as the demo filename — the slug is permanent once published.
- If you later split the component, re-run `npm run build:21st` so the published
  source matches the registry.
