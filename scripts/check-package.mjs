import { execFileSync } from "node:child_process"
import { access } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

/**
 * Verifies the npm package layout: emitted files exist, the entry point imports
 * cleanly, and `npm pack` ships exactly the expected files.
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")

const required = [
  "tree.js",
  "tree.d.ts",
  "use-tree.js",
  "use-tree.d.ts",
  "types.js",
  "types.d.ts",
]

for (const file of required) {
  await access(join(root, "dist-lib", file)).catch(() => {
    throw new Error(`dist-lib/${file} is missing — run \`npm run build:lib\` first`)
  })
}

const entry = pathToFileURL(join(root, "dist-lib", "tree.js")).href
const mod = await import(entry)
if (typeof mod.Tree !== "function") {
  throw new Error("dist-lib/tree.js does not export a Tree component")
}

const isWindows = process.platform === "win32"
const npmExecPath = process.env.npm_execpath
const output = npmExecPath
  ? execFileSync(process.execPath, [npmExecPath, "pack", "--dry-run", "--json"], {
      cwd: root,
      encoding: "utf8",
    })
  : execFileSync(isWindows ? "npm.cmd" : "npm", ["pack", "--dry-run", "--json"], {
      cwd: root,
      encoding: "utf8",
      shell: isWindows,
    })

const start = output.indexOf("[")
if (start < 0) throw new Error(`could not parse npm pack output:\n${output}`)
const [{ files, filename, size }] = JSON.parse(output.slice(start))

const paths = files.map((file) => file.path)
for (const expected of [
  "dist-lib/tree.js",
  "dist-lib/tree.d.ts",
  "dist-lib/use-tree.js",
  "dist-lib/types.d.ts",
  "README.md",
  "LICENSE",
]) {
  if (!paths.includes(expected)) throw new Error(`npm pack is missing ${expected}`)
}
for (const forbidden of ["src/", ".github/", "docs/", "package-lock.json"]) {
  if (paths.some((path) => path.startsWith(forbidden))) {
    throw new Error(`npm pack should not include ${forbidden}`)
  }
}

console.log(
  `package:check passed (${paths.length} files, ${(size / 1024).toFixed(1)} kB tarball: ${filename})`,
)
