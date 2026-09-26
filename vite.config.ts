import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'recharts': ['recharts'],
          'xlsx': ['xlsx'],
          'dexie': ['dexie', 'dexie-react-hooks'],
        },
      },
    },
  },
  server: { host: true, port: 3000, cors: true, allowedHosts: true },
});
