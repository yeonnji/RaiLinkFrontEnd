import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const shippingApiProxy = {
  target: "https://cloudrun-test-530608231336.asia-northeast3.run.app",
  changeOrigin: true,
  secure: true,
};

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": shippingApiProxy,
    },
  },
  preview: {
    proxy: {
      "/api": shippingApiProxy,
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
