/**
 * Single place to rename the repository. `npm run set-repo -- <owner>/<repo>`
 * rewrites these values, the README placeholders and package.json.
 */
export const site = {
  owner: "OWNER",
  repo: "tree-ui",
  version: "0.1.0",
} as const

export const repoUrl = `https://github.com/${site.owner}/${site.repo}`
export const siteUrl = `https://${site.owner.toLowerCase()}.github.io/${site.repo}`
export const registryUrl = `${siteUrl}/r/tree.json`
export const installCommand = `npx shadcn@latest add ${registryUrl}`
