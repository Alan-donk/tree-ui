import { AsyncTree } from "@/demo/demos/async-tree"
import { BasicTree } from "@/demo/demos/basic-tree"
import { CustomTree } from "@/demo/demos/custom-tree"
import { MultiSelectTree } from "@/demo/demos/multi-select-tree"
import { GithubIcon, TreeMark } from "@/demo/components/icons"
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CodeBlock,
  CopyButton,
  Kbd,
  LinkButton,
  SectionHeading,
  Table,
  Td,
  Th,
  ThemeToggle,
} from "@/demo/components/ui"
import { installCommand, registryUrl, repoUrl, site, siteUrl } from "@/demo/site"

const features = [
  {
    title: "Keyboard first",
    body: "Roving tabindex, arrow navigation, typeahead and a wildcard to expand a whole level. Every row exposes level, position and set size.",
  },
  {
    title: "Zero dependencies",
    body: "No Base UI, no Radix, no headless framework. Three files, React and your Tailwind + shadcn tokens. Nothing else to audit.",
  },
  {
    title: "Async children",
    body: "Pass a loadChildren function and nodes fetch on first expand, cache the result and announce failures with a retry affordance.",
  },
  {
    title: "Controlled or not",
    body: "Expansion and selection both work controlled or uncontrolled. Swap in expandedIds or selectedIds whenever you need them.",
  },
]

const codeExample = `import { Tree } from "@/components/tree/tree"

const files = [
  {
    id: "src",
    label: "src",
    children: [{ id: "src/index.ts", label: "index.ts" }],
  },
]

export function Files() {
  return (
    <Tree
      data={files}
      aria-label="Project files"
      defaultExpandedIds={["src"]}
      onSelectionChange={(ids) => console.log(ids)}
    />
  )
}`

const propsRows: Array<[string, string, string, string]> = [
  ["data", "TreeNode[]", "—", "Root nodes. Every node needs a unique id."],
  ["aria-label", "string", "—", "Accessible name for the tree. Required."],
  ["selectionMode", '"none" | "single" | "multiple"', '"single"', "Selection behaviour and aria-selected."],
  ["expandedIds", "string[]", "—", "Controlled expanded ids."],
  ["defaultExpandedIds", "string[]", "[]", "Initial expanded ids when uncontrolled."],
  ["onExpandedChange", "(ids: string[]) => void", "—", "Fires on expand, collapse and * expansion."],
  ["selectedIds", "string[]", "—", "Controlled selected ids."],
  ["defaultSelectedIds", "string[]", "[]", "Initial selection when uncontrolled."],
  ["onSelectionChange", "(ids: string[]) => void", "—", "Fires on click, Enter, Space and Shift range."],
  ["loadChildren", "(node) => Promise<TreeNode[]>", "—", "Enables async nodes. Results are cached per id."],
  ["onLoadError", "(node, error) => void", "—", "Called when loadChildren rejects."],
  ["renderIcon", "(node, ctx) => ReactNode", "—", "Icon slot. Falls back to node.icon."],
  ["renderActions", "(node, ctx) => ReactNode", "—", "Trailing slot for badges or actions."],
  ["renderEmpty", "() => ReactNode", "—", "Custom empty state."],
  ["indent", "number", "16", "Pixels of indentation per level."],
  ["messages", "Partial<TreeMessages>", "—", "Translate loading, retry, empty and chevron labels."],
  ["className / itemClassName", "string", "—", "Class hooks for the root and every row."],
]

const keyboardRows: Array<[string, string]> = [
  ["↑ / ↓", "Previous / next visible node"],
  ["→", "Expand, or move to the first child"],
  ["←", "Collapse, or move to the parent"],
  ["Home / End", "First / last visible node"],
  ["Enter / Space", "Select (or toggle expansion when selectionMode is none)"],
  ["*", "Expand every sibling on the same level"],
  ["a–z, 0–9", "Typeahead within the visible nodes"],
  ["⌘/Ctrl + click", "Toggle in multiple mode"],
  ["Shift + click", "Select a range in multiple mode"],
  ["Double click", "Toggle expansion"],
]

function PropCode({ children }: { children: string }) {
  return <code className="font-mono text-xs text-foreground">{children}</code>
}

export function App() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <a href="#top" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <TreeMark className="size-5 text-brand" />
            tree-ui
          </a>
          <Badge className="hidden sm:inline-flex">v{site.version}</Badge>
          <nav className="ms-auto flex items-center gap-0.5 text-sm" aria-label="Sections">
            <a
              href="#install"
              className="hidden rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:block"
            >
              Install
            </a>
            <a
              href="#examples"
              className="hidden rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:block"
            >
              Examples
            </a>
            <a
              href="#api"
              className="hidden rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:block"
            >
              API
            </a>
            <a
              href="#accessibility"
              className="hidden rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:block"
            >
              Accessibility
            </a>
            <LinkButton href={repoUrl} variant="ghost" size="icon" className="me-1 size-8" aria-label="GitHub repository">
              <GithubIcon className="size-4" />
            </LinkButton>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-5xl px-4">
        <section className="pt-14 pb-10 sm:pt-20">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-brand/40 bg-brand/10 text-brand">shadcn registry</Badge>
            <Badge>zero dependencies</Badge>
            <Badge>MIT</Badge>
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            The tree view{" "}
            <span className="bg-gradient-to-r from-brand to-brand/50 bg-clip-text text-transparent">
              shadcn hasn&apos;t shipped
            </span>
            .
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Keyboard-first, accessible, async-ready, and styled with the tokens you already have. Install it
            with the shadcn CLI and own the three files it writes.
          </p>

          <div className="mt-7 flex max-w-2xl items-center gap-2 rounded-lg border border-border bg-muted/30 p-1.5 ps-3">
            <span aria-hidden="true" className="font-mono text-sm text-muted-foreground select-none">
              $
            </span>
            <code className="min-w-0 flex-1 overflow-x-auto font-mono text-[13px] whitespace-nowrap text-foreground">
              {installCommand}
            </code>
            <CopyButton value={installCommand} label="Copy install command" />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <LinkButton href="#examples" variant="default">
              See it in action
            </LinkButton>
            <LinkButton href={repoUrl} variant="outline">
              <GithubIcon className="size-4" />
              Star on GitHub
            </LinkButton>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-lg border border-border bg-card/50 p-4">
                <h3 className="text-sm font-medium">{feature.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="install" className="scroll-mt-20 border-t border-border/70 py-12">
          <SectionHeading
            eyebrow="Install"
            title="One command, then the code is yours"
            description="The registry URL ships the component sources only. No npm package, no version lock, no runtime dependency to upgrade."
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>shadcn CLI</CardTitle>
                <CardDescription>Works in any project with components.json.</CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock>{`npx shadcn@latest add ${registryUrl}`}</CodeBlock>
                <p className="mt-3 text-xs text-muted-foreground">
                  Writes <PropCode>components/tree/tree.tsx</PropCode>,{" "}
                  <PropCode>components/tree/use-tree.ts</PropCode> and{" "}
                  <PropCode>components/tree/types.ts</PropCode>.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Manual</CardTitle>
                <CardDescription>Copy three files, no CLI required.</CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock>{`npx degit ${site.owner}/${site.repo}#main/src/registry/tree ./components/tree`}</CodeBlock>
                <p className="mt-3 text-xs text-muted-foreground">
                  Requires React 19 and the default shadcn CSS variables (
                  <PropCode>bg-accent</PropCode>, <PropCode>ring-ring</PropCode>, …).
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Drop-in usage</CardTitle>
                <CardDescription>Data in, accessible tree out.</CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock>{codeExample}</CodeBlock>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Agent friendly</CardTitle>
                <CardDescription>Let a coding agent install it for you.</CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock>{`Read ${registryUrl}
and add the tree component to my project.`}</CodeBlock>
                <p className="mt-3 text-xs text-muted-foreground">
                  The registry JSON embeds full source, and{" "}
                  <a className="underline underline-offset-2 hover:text-foreground" href={`${siteUrl}/llms.txt`}>
                    llms.txt
                  </a>{" "}
                  documents the API for agents.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="examples" className="scroll-mt-20 border-t border-border/70 py-12">
          <SectionHeading
            eyebrow="Examples"
            title="Four trees, one component"
            description="Every example below is live: it is the real component, not a screenshot."
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>File tree</CardTitle>
                <CardDescription>Uncontrolled expansion, single selection, click a row.</CardDescription>
              </CardHeader>
              <CardContent>
                <BasicTree />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Async children</CardTitle>
                <CardDescription>Children load on first expand and stay cached.</CardDescription>
              </CardHeader>
              <CardContent>
                <AsyncTree />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Multiple selection</CardTitle>
                <CardDescription>Cmd/Ctrl to toggle, Shift for a range, disabled nodes skipped.</CardDescription>
              </CardHeader>
              <CardContent>
                <MultiSelectTree />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Custom icons and actions</CardTitle>
                <CardDescription>renderIcon / renderActions slots keep ARIA intact.</CardDescription>
              </CardHeader>
              <CardContent>
                <CustomTree />
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="api" className="scroll-mt-20 border-t border-border/70 py-12">
          <SectionHeading
            eyebrow="API"
            title="Everything is a prop"
            description="No context provider, no compound parts to memorise — one component, one node shape."
          />
          <Table>
            <thead>
              <tr>
                <Th>Prop</Th>
                <Th>Type</Th>
                <Th>Default</Th>
                <Th>Description</Th>
              </tr>
            </thead>
            <tbody>
              {propsRows.map(([name, type, fallback, description]) => (
                <tr key={name}>
                  <Td>
                    <PropCode>{name}</PropCode>
                  </Td>
                  <Td>
                    <PropCode>{type}</PropCode>
                  </Td>
                  <Td>
                    <PropCode>{fallback}</PropCode>
                  </Td>
                  <Td>{description}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">
            <PropCode>TreeNode</PropCode> ={" "}
            <PropCode>
              {"{ id, label, children?, icon?, disabled?, searchText?, data? }"}
            </PropCode>
          </p>
        </section>

        <section id="accessibility" className="scroll-mt-20 border-t border-border/70 py-12">
          <SectionHeading
            eyebrow="Accessibility"
            title="A treeview, not a div soup"
            description="Implements the WAI-ARIA tree view pattern: one tab stop, roving focus, complete positional metadata."
          />
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Table>
              <thead>
                <tr>
                  <Th>Key</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {keyboardRows.map(([keys, action]) => (
                  <tr key={keys}>
                    <Td>
                      <Kbd>{keys}</Kbd>
                    </Td>
                    <Td>{action}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <span className="text-foreground">Roles:</span> <PropCode>tree</PropCode> /{" "}
                <PropCode>treeitem</PropCode> with <PropCode>aria-level</PropCode>,{" "}
                <PropCode>aria-posinset</PropCode> and <PropCode>aria-setsize</PropCode>.
              </li>
              <li>
                <span className="text-foreground">State:</span> <PropCode>aria-expanded</PropCode>,{" "}
                <PropCode>aria-selected</PropCode>, <PropCode>aria-disabled</PropCode> and{" "}
                <PropCode>aria-busy</PropCode> are derived, never hand-written.
              </li>
              <li>
                <span className="text-foreground">Async failures</span> are announced through a polite live
                region and retryable with Enter.
              </li>
              <li>
                <span className="text-foreground">Reduced motion:</span> transitions are{" "}
                <PropCode>motion-safe</PropCode> only.
              </li>
              <li>
                <span className="text-foreground">SSR safe:</span> no <PropCode>window</PropCode> access
                during render.
              </li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 py-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <p className="flex items-center gap-2">
            <TreeMark className="size-4" />
            MIT © {new Date().getFullYear()} tree-ui
          </p>
          <div className="flex flex-wrap items-center gap-4 sm:ms-auto">
            <a className="hover:text-foreground" href={registryUrl}>
              registry.json
            </a>
            <a className="hover:text-foreground" href={`${siteUrl}/llms.txt`}>
              llms.txt
            </a>
            <a className="hover:text-foreground" href={repoUrl}>
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
