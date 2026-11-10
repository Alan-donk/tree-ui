import { mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises"
import { spawnSync } from "node:child_process"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

/**
 * Proves the registry artifact can be dropped into a fresh project and still
 * type-checks on its own. Runs `tsc` against the installed files using this
 * repo's node_modules for React types only.
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const smokeDir = join(root, ".smoke")
const keep = process.argv.includes("--keep")

const artifact = JSON.parse(await readFile(join(root, "public", "r", "tree.json"), "utf8"))

await rm(smokeDir, { recursive: true, force: true })
await mkdir(smokeDir, { recursive: true })

// Resolve the registry target placeholders the way the shadcn CLI does.
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

for (const file of artifact.files) {
  const target = join(smokeDir, resolveTarget(file.target))
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, file.content, "utf8")
}

await writeFile(
  join(smokeDir, "tsconfig.json"),
  `${JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        jsx: "react-jsx",
        module: "ESNext",
        moduleResolution: "bundler",
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        verbatimModuleSyntax: true,
        isolatedModules: true,
      },
      include: ["components/**/*.ts", "components/**/*.tsx"],
    },
    null,
    2,
  )}\n`,
  "utf8",
)

await symlink(join(root, "node_modules"), join(smokeDir, "node_modules"), "junction")

const tsc = join(root, "node_modules", "typescript", "bin", "tsc")
const result = spawnSync(process.execPath, [tsc, "-p", join(smokeDir, "tsconfig.json")], {
  cwd: root,
  stdio: "inherit",
})

if (!keep) await rm(smokeDir, { recursive: true, force: true })

if (result.status !== 0) {
  console.error("registry:smoke failed — the installed files do not type-check on their own")
  process.exit(result.status ?? 1)
}

console.log(`registry:smoke passed (${artifact.files.length} files installed and type-checked)`)
