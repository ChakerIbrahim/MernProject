import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // C-6: the server's CORS policy names http://localhost:5173 explicitly.
    // strictPort makes a taken port fail loudly instead of silently sliding
    // to 5174 and breaking CORS in every later sprint.
    port: 5173,
    strictPort: true,
  },
});
