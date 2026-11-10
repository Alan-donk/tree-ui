import { readFile, writeFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

/**
 * Usage: npm run set-repo -- <owner>/<repo>
 * Rewrites the owner/repo placeholders across the repo.
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const input = process.argv[2]

if (!input || !/^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/.test(input)) {
  console.error("Usage: npm run set-repo -- <owner>/<repo>   e.g. npm run set-repo -- alan/tree-ui")
  process.exit(1)
}

const [owner, repo] = input.split("/")
const siteUrl = `https://${owner.toLowerCase()}.github.io/${repo}`
const registryUrl = `${siteUrl}/r/tree.json`

if (repo !== repo.toLowerCase()) {
  console.warn("warning: GitHub Pages lowercases repository names; consider a lowercase repo name")
}

const replacements = {
  "{{OWNER}}": owner,
  "{{REPO}}": repo,
  "{{SITE_URL}}": siteUrl,
  "{{REGISTRY_URL}}": registryUrl,
}

async function rewrite(path, transform) {
  const original = await readFile(join(root, path), "utf8")
  const updated = transform(original)
  if (updated !== original) {
    await writeFile(join(root, path), updated, "utf8")
    console.log(`updated ${path}`)
  }
}

await rewrite("package.json", (content) => {
  const pkg = JSON.parse(content)
  pkg.name = `@${owner.toLowerCase()}/${repo.toLowerCase()}`
  pkg.repository = { type: "git", url: `git+https://github.com/${owner}/${repo}.git` }
  pkg.homepage = `https://github.com/${owner}/${repo}`
  pkg.bugs = { url: `https://github.com/${owner}/${repo}/issues` }
  return `${JSON.stringify(pkg, null, 2)}\n`
})

await rewrite("registry.json", (content) =>
  content.replace(/"homepage":\s*"[^"]*"/, `"homepage": "https://github.com/${owner}/${repo}"`),
)

await rewrite("src/demo/site.ts", (content) =>
  content
    .replace(/(owner:\s*)"[^"]*"/, `$1"${owner}"`)
    .replace(/(repo:\s*)"[^"]*"/, `$1"${repo}"`),
)

for (const doc of ["README.md", "README.zh-CN.md", "PUBLISH.md"]) {
  await rewrite(doc, (content) =>
    Object.entries(replacements).reduce(
      (acc, [token, value]) => acc.split(token).join(value),
      content,
    ),
  )
}

console.log(`\nowner:        ${owner}`)
console.log(`repo:         ${repo}`)
console.log(`demo:         ${siteUrl}`)
console.log(`registry:     ${registryUrl}`)
