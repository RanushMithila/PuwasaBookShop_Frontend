import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../electron/dist-frontend",
  },
  server: {
    port: 5173,
    host: true, // Allow external connections
    strictPort: true, // Exit if port is already in use
    proxy: {
      "/api": {
        target: "https://13-228-206-118.sslip.io",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  base: "./", // Important for Electron
});
