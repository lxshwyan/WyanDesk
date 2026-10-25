import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react()],
  build: { target: 'es2022', sourcemap: true },
  server: {
    port: 8097,
    proxy: { '/api/desk': { target: loadEnv(mode, '.', '').RELAX_API_URL || 'http://127.0.0.1:8098', changeOrigin: false } },
  },
}));
