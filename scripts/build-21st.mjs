import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

/**
 * 21st.dev's CLI publishes one self-contained component file plus a demo, while
 * our registry ships three files. This script flattens the three sources into a
 * single module (they only import each other) and writes it to publish/21st/.
 *
 * Usage: npm run build:21st
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const sourceDir = join(root, "src", "registry", "tree")
const outDir = join(root, "publish", "21st")

const sources = ["types.ts", "use-tree.ts", "tree.tsx"]
const reexportBlock = /^export type \{[^}]*\} from ["']\.\/types(?:\.js)?["']\s*$/m

const chunks = []
for (const file of sources) {
  let code = await readFile(join(sourceDir, file), "utf8")
  code = code.replace(reexportBlock, "")
  // Strip imports that only point at the two sibling files.
  code = code.replace(/^import \{[\s\S]*?\} from "\.\/use-tree\.js"\n/m, "")
  code = code.replace(/^import type \{[\s\S]*?\} from "\.\/types\.js"\n/m, "")
  code = code.replace(/^import type \{ ReactNode \} from "react"\n/m, "")
  code = code.replace(/^import \* as React from "react"\n/m, "")
  // Drop the re-export of types declared in this same file.
  code = code.replace(/^export type \{ FlatNode[\s\S]*?\}\n/m, "")
  // The eslint suppression only matters inside our repo's lint config.
  code = code.replace(/^\s*\/\/ eslint-disable-next-line jsx-a11y\/click-events-have-key-events\n/m, "")
  chunks.push(code.trim())
}

const header = `// tree-ui — generated single-file build for 21st.dev.
// Do not edit by hand: run \`npm run build:21st\` in the tree-ui repository.

import * as React from "react"
import type { ReactNode } from "react"
`

const bundle = `${header}
${chunks.join("\n\n")}

export default Tree
`

await mkdir(outDir, { recursive: true })
await writeFile(join(outDir, "tree.tsx"), bundle, "utf8")
console.log(`21st: wrote publish/21st/tree.tsx (${(bundle.length / 1024).toFixed(1)} kB)`)
