import { mkdir } from "node:fs/promises"
import { spawn } from "node:child_process"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { chromium } from "playwright"

/**
 * Captures the README screenshots from the built demo.
 *
 * Playwright's bundled Chromium download is often blocked on restricted
 * networks, so this falls back to an installed Chrome/Edge (`PW_CHANNEL` can
 * force a channel, e.g. PW_CHANNEL=chrome).
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const port = Number(process.env.PREVIEW_PORT ?? 4180)
const base = `http://localhost:${port}`
const channels = process.env.PW_CHANNEL ? [process.env.PW_CHANNEL] : ["msedge", "chrome"]

const vite = join(root, "node_modules", "vite", "bin", "vite.js")
const server = spawn(process.execPath, [vite, "preview", "--port", String(port), "--strictPort"], {
  cwd: root,
  stdio: "ignore",
})

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(base)
      if (response.ok) return
    } catch {
      // not up yet
    }
    await new Promise((done) => setTimeout(done, 250))
  }
  throw new Error(`preview server did not start on ${base}`)
}

async function launch() {
  const errors = []
  for (const channel of channels) {
    try {
      return await chromium.launch({ channel })
    } catch (error) {
      errors.push(`${channel}: ${String(error.message).split("\n")[0]}`)
    }
  }
  throw new Error(`could not launch a browser\n${errors.join("\n")}`)
}

/** Screenshots a section without the sticky header overlapping it. */
async function captureSection(page, selector, file) {
  await page.evaluate(() => {
    const header = document.querySelector("header")
    if (header instanceof HTMLElement) header.style.visibility = "hidden"
    window.scrollTo(0, 0)
  })
  const box = await page.locator(selector).boundingBox()
  if (!box) throw new Error(`could not measure ${selector}`)
  await page.screenshot({
    path: join(root, "docs", file),
    fullPage: true,
    clip: { x: box.x, y: box.y, width: box.width, height: box.height },
  })
  await page.evaluate(() => {
    const header = document.querySelector("header")
    if (header instanceof HTMLElement) header.style.visibility = ""
  })
}

try {
  await waitForServer()
  await mkdir(join(root, "docs"), { recursive: true })

  const browser = await launch()
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  })

  await page.goto(base, { waitUntil: "networkidle" })
  await page.evaluate(() => document.fonts.ready)

  await page.screenshot({
    path: join(root, "docs", "preview.png"),
    clip: { x: 0, y: 0, width: 1280, height: 900 },
  })

  await captureSection(page, "#examples", "examples.png")
  await captureSection(page, "#accessibility", "accessibility.png")

  await browser.close()
  console.log("screenshot: wrote docs/preview.png, docs/examples.png, docs/accessibility.png")
} finally {
  server.kill()
}
