import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")

const registry = JSON.parse(await readFile(join(root, "registry.json"), "utf8"))
const item = registry.items?.find((entry) => entry.name === "tree")
if (!item) {
  throw new Error("registry.json does not contain a `tree` item")
}
if (!Array.isArray(item.files) || item.files.length === 0) {
  throw new Error("registry.json `tree` item has no files")
}

const files = []
for (const file of item.files) {
  if (!file.path || !file.target || !file.type) {
    throw new Error(`Invalid registry file entry: ${JSON.stringify(file)}`)
  }
  const content = await readFile(join(root, file.path), "utf8")
  files.push({
    path: file.path,
    target: file.target,
    type: file.type,
    content,
  })
}

const output = {
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: item.name,
  type: item.type,
  title: item.title,
  description: item.description,
  dependencies: item.dependencies ?? [],
  registryDependencies: item.registryDependencies ?? [],
  categories: item.categories ?? [],
  files,
}

const outFile = join(root, "public", "r", "tree.json")
await mkdir(dirname(outFile), { recursive: true })
await writeFile(outFile, `${JSON.stringify(output, null, 2)}\n`, "utf8")

const bytes = files.reduce((total, file) => total + Buffer.byteLength(file.content, "utf8"), 0)
console.log(
  `registry: wrote public/r/tree.json (${files.length} files, ${(bytes / 1024).toFixed(1)} kB of source)`,
)
for (const file of files) {
  console.log(`  - ${file.path} -> ${file.target}`)
}
