import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const shippingApiProxy = {
  target: "https://railink-run-530608231336.asia-northeast3.run.app",
  changeOrigin: true,
  secure: true,
};

const historyApiProxy = {
  target: "https://railink-run-530608231336.asia-northeast3.run.app",
  changeOrigin: true,
  secure: true,
};

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/history": historyApiProxy,
      "/api": shippingApiProxy,
    },
  },
  preview: {
    proxy: {
      "/api/history": historyApiProxy,
      "/api": shippingApiProxy,
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
