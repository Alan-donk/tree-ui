import { fileURLToPath, URL } from "node:url"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

/**
 * `VITE_BASE` lets GitHub Pages serve the demo from `/<repo>/`.
 * Locally it stays `/`, so `npm run preview` is a drop-in check.
 */
const base = process.env.VITE_BASE ?? "/"

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
})
