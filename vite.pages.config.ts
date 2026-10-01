import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/** Static copy of the game for GitHub Pages. The live preview keeps using vite.config.ts. */
export default defineConfig({
  root: "pages",
  base: "/princess-twirl/",
  publicDir: "../public",
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  plugins: [tailwindcss(), react()],
  build: {
    outDir: "../docs",
    emptyOutDir: true,
  },
});
