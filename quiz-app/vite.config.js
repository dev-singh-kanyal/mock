import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Use your repository name for project pages (https://<user>.github.io/<repo>/).
  // Keep root path for local development.
  base: process.env.NODE_ENV === "production" ? "/mock/" : "/",
});
