import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Allow external connections
    strictPort: true, // Exit if port is already in use
    proxy: {
      "/api": {
        target: "http://172.191.203.238",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  base: "./", // Important for Electron
});
