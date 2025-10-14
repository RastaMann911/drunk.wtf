import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// @ts-ignore - plugin type is available via deps
export default defineConfig({
  plugins: [react()],
});
