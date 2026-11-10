import type { TreeNode } from "@/registry/tree/tree"

export const fileTree: TreeNode[] = [
  {
    id: "src",
    label: "src",
    children: [
      {
        id: "src/components",
        label: "components",
        children: [
          { id: "src/components/tree.tsx", label: "tree.tsx" },
          { id: "src/components/use-tree.ts", label: "use-tree.ts" },
          { id: "src/components/types.ts", label: "types.ts" },
        ],
      },
      {
        id: "src/demo",
        label: "demo",
        children: [
          { id: "src/demo/app.tsx", label: "app.tsx" },
          { id: "src/demo/main.tsx", label: "main.tsx" },
        ],
      },
      { id: "src/index.ts", label: "index.ts" },
    ],
  },
  {
    id: "public",
    label: "public",
    children: [
      { id: "public/favicon.svg", label: "favicon.svg" },
      { id: "public/llms.txt", label: "llms.txt" },
    ],
  },
  { id: "package.json", label: "package.json" },
  { id: "tsconfig.json", label: "tsconfig.json" },
  { id: "README.md", label: "README.md" },
]

export const asyncTree: TreeNode[] = [
  { id: "workspace", label: "acme-workspace" },
  { id: "apps", label: "apps" },
  { id: "packages", label: "packages" },
  { id: "infra", label: "infra" },
]

const asyncChildren: Record<string, TreeNode[]> = {
  workspace: [
    { id: "workspace/apps", label: "apps", children: undefined },
    { id: "workspace/packages", label: "packages", children: undefined },
    { id: "workspace/tooling", label: "tooling" },
  ],
  apps: [
    { id: "apps/web", label: "web", children: [{ id: "apps/web/page.tsx", label: "page.tsx" }] },
    { id: "apps/docs", label: "docs" },
  ],
  packages: [
    { id: "packages/ui", label: "@acme/ui" },
    { id: "packages/config", label: "@acme/config" },
  ],
  "workspace/apps": [
    { id: "workspace/apps/web", label: "web" },
    { id: "workspace/apps/docs", label: "docs" },
  ],
  "workspace/packages": [
    { id: "workspace/packages/ui", label: "ui" },
    { id: "workspace/packages/theme", label: "theme" },
  ],
}

const attempts = new Map<string, number>()

/** Simulated API: the `apps` node fails on its first try so retry is demoable. */
export function loadAsyncChildren(node: TreeNode): Promise<TreeNode[]> {
  const attempt = (attempts.get(node.id) ?? 0) + 1
  attempts.set(node.id, attempt)
  return new Promise<TreeNode[]>((resolve, reject) => {
    setTimeout(() => {
      if (node.id === "apps" && attempt === 1) {
        reject(new Error("Request failed"))
        return
      }
      resolve(asyncChildren[node.id] ?? [])
    }, 650)
  })
}

export function resetAsyncDemo(): void {
  attempts.clear()
}

/** 80 folders × 25 files = 2,080 rows, used by the virtualized demo. */
export function createLargeTree(folders = 80, filesPerFolder = 25): TreeNode[] {
  return Array.from({ length: folders }, (_, folder) => {
    const id = `package-${String(folder).padStart(2, "0")}`
    return {
      id,
      label: id,
      children: Array.from({ length: filesPerFolder }, (_, file) => ({
        id: `${id}/file-${String(file).padStart(2, "0")}`,
        label: `file-${String(file).padStart(2, "0")}.ts`,
      })),
    }
  })
}

export const orgTree: TreeNode[] = [
  {
    id: "engineering",
    label: "Engineering",
    children: [
      {
        id: "engineering/platform",
        label: "Platform",
        children: [
          { id: "engineering/platform/data", label: "Data" },
          { id: "engineering/platform/infra", label: "Infra" },
          { id: "engineering/platform/security", label: "Security" },
        ],
      },
      {
        id: "engineering/product",
        label: "Product Eng",
        children: [
          { id: "engineering/product/web", label: "Web" },
          { id: "engineering/product/mobile", label: "Mobile", disabled: true },
        ],
      },
    ],
  },
  {
    id: "design",
    label: "Design",
    children: [
      { id: "design/brand", label: "Brand" },
      { id: "design/systems", label: "Design Systems" },
    ],
  },
  { id: "people", label: "People Ops" },
]
