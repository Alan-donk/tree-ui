# Publishing tree-ui to GitHub

Everything below runs from the repository root. The default
branch is `main`.

> First time on this machine? Read [GITHUB-SETUP.md](./GITHUB-SETUP.md) for the
> authentication choice (GitHub CLI, PAT or SSH) and the repository/Pages
> settings checklist.

## 1. Rename the repository (once)

```bash
npm run set-repo -- <owner>/<repo>
```

This updates `package.json`, `registry.json`, `src/demo/site.ts`, the READMEs and
this file. The demo URL and registry URL are derived from it:

- Demo: `https://<owner>.github.io/<repo>/`
- Registry: `https://<owner>.github.io/<repo>/r/tree.json`

## 2. Commit locally

```bash
git init -b main
git add -A
git commit -m "feat: accessible tree view for shadcn/ui"
git tag v0.1.0
```

## 3. Create the empty repository

On <https://github.com/new>:

- name: `<repo>` (match step 1)
- visibility: Public
- do **not** add a README, .gitignore or license

## 4. Push

```bash
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin main
git push origin v0.1.0
```

If git asks for credentials, use a Personal Access Token as the password, or run
`git config --global credential.helper manager` first.

## 5. Turn on GitHub Pages

Repository → **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The `Deploy demo` workflow then publishes `dist/` on every push to `main`.

## 6. Verify the published install

Once the `Deploy demo` workflow is green:

```bash
curl -s https://<owner>.github.io/<repo>/r/tree.json | head -c 200
```

In any shadcn project:

```bash
npx shadcn@latest add https://<owner>.github.io/<repo>/r/tree.json
```

## Optional: submit to directories

- shadcn registry directory: add the registry URL to your project docs and submit
  a PR/issue where relevant.
- 21st.dev and similar registries accept registry URLs.

## Local verification (before pushing)

```bash
npm run verify
npm run preview   # open http://localhost:4173
```
