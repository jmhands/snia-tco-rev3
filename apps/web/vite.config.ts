import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) {
            return "recharts"
          }
          if (
            id.includes("node_modules/@base-ui") ||
            id.includes("node_modules/lucide-react") ||
            id.includes("node_modules/sonner")
          ) {
            return "ui-vendor"
          }
        },
      },
    },
  },
})
