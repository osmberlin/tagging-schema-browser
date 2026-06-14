import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { type Plugin, defineConfig } from "vite";

/**
 * GitHub Pages has no SPA rewrite, so a refresh/deep-link to a client route
 * (e.g. /icons, /about) would 404. Emitting 404.html as a copy of index.html
 * makes Pages serve the app for any unknown path, and the router takes over.
 */
function spaFallback(): Plugin {
  let outDir = "dist";
  return {
    name: "spa-404-fallback",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const index = path.resolve(outDir, "index.html");
      if (existsSync(index)) copyFileSync(index, path.resolve(outDir, "404.html"));
    },
  };
}

export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), spaFallback()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
