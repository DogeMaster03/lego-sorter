import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative paths so packaged Electron can load assets from file://
  base: "./",
  server: {
    port: 5173,
    strictPort: true,
  },
});
