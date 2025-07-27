import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import framer from "vite-plugin-framer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    cors: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Cross-Origin-Embedder-Policy": "cross-origin",
      "Cross-Origin-Opener-Policy": "cross-origin"
    },
    // Ensure the server is accessible from Framer
    strictPort: true,
    open: false
  },
  // Optimize for Framer plugin environment
  define: {
    global: 'globalThis',
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      input: 'src/plugin.ts',
      output: {
        format: 'es',
        inlineDynamicImports: true,
        entryFileNames: 'plugin.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    outDir: 'dist',
    assetsDir: 'assets'
  },
  plugins: [
    react(),
    framer(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
