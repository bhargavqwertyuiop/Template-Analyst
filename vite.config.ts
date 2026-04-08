import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // 🔥 IMPORTANT: Fix for GitHub Pages
  base: '/Template-Analyst/',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },

  server: {
    // Keep your existing logic
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
