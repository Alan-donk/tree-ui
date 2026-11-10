import { readFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const failures = []

// Mirrors how the shadcn CLI resolves the `@components/`, `@ui/` and `@lib/`
// target placeholders for a default project layout.
const placeholderRoots = {
  "@components/": "components/",
  "@ui/": "components/ui/",
  "@lib/": "lib/",
  "@hooks/": "hooks/",
}

function resolveTarget(target) {
  for (const [prefix, replacement] of Object.entries(placeholderRoots)) {
    if (target.startsWith(prefix)) return `${replacement}${target.slice(prefix.length)}`
  }
  return target
}

function check(condition, message) {
  if (!condition) failures.push(message)
}

const registry = JSON.parse(await readFile(join(root, "registry.json"), "utf8"))
const item = registry.items?.find((entry) => entry.name === "tree")
check(Boolean(item), "registry.json: missing `tree` item")

if (item) {
  check(item.type === "registry:ui", "registry.json: item type must be registry:ui")
  check(Array.isArray(item.files) && item.files.length === 3, "registry.json: expected exactly 3 files")
}

let artifact
try {
  artifact = JSON.parse(await readFile(join(root, "public", "r", "tree.json"), "utf8"))
} catch {
  failures.push("public/r/tree.json: missing. Run `npm run registry:build` first.")
}

if (artifact) {
  check(artifact.name === "tree", "public/r/tree.json: name must be `tree`")
  check(Array.isArray(artifact.files) && artifact.files.length === 3, "public/r/tree.json: expected 3 files")

  const resolvedTargets = new Set()
  for (const file of artifact.files ?? []) {
    check(
      typeof file.content === "string" && file.content.length > 0,
      `public/r/tree.json: empty content for ${file.path}`,
    )
    check(
      typeof file.target === "string" && /^(@components|@ui|@lib|@hooks)\//.test(file.target),
      `public/r/tree.json: target ${file.target} must use a registry placeholder so custom aliases work`,
    )

    const resolvedTarget = typeof file.target === "string" ? resolveTarget(file.target) : ""
    check(
      resolvedTarget.startsWith("components/tree/"),
      `public/r/tree.json: unexpected resolved target ${resolvedTarget}`,
    )
    check(
      !resolvedTargets.has(resolvedTarget),
      `public/r/tree.json: duplicate target ${resolvedTarget}`,
    )
    resolvedTargets.add(resolvedTarget)

    const imports = [...(file.content ?? "").matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1])
    for (const specifier of imports) {
      const allowed = specifier.startsWith(".") || specifier === "react" || specifier === "react/jsx-runtime"
      check(allowed, `${file.path}: dependency "${specifier}" breaks the zero-dependency promise`)
    }
    check(!(file.content ?? "").includes("@/"), `${file.path}: use relative imports, not the "@/..." alias`)
    check(!(file.content ?? "").includes("process.env"), `${file.path}: component must not read process.env`)
    check(!(file.content ?? "").includes("TODO"), `${file.path}: unresolved TODO`)
  }

  for (const expected of [
    "components/tree/tree.tsx",
    "components/tree/use-tree.ts",
    "components/tree/types.ts",
  ]) {
    check(resolvedTargets.has(expected), `public/r/tree.json: missing target ${expected}`)
  }
}

if (failures.length > 0) {
  console.error("registry:check failed:")
  for (const failure of failures) console.error(`  ✗ ${failure}`)
  process.exit(1)
}

console.log("registry:check passed")
