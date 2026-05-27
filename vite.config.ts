import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const useNodeBackend = process.env.VITE_BACKEND === "node";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative paths so packaged Electron can load assets from file://
  base: useNodeBackend ? "/" : "./",
  define: {
    "import.meta.env.VITE_BACKEND": JSON.stringify(
      process.env.VITE_BACKEND ?? "",
    ),
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: useNodeBackend
      ? {
          "/api": {
            target: "http://127.0.0.1:3001",
            changeOrigin: true,
          },
        }
      : undefined,
  },
});
