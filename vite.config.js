/* eslint-disable no-undef */
import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base:process.env.VITE_BASE_PATH || "/community_volunteering_plateform",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
