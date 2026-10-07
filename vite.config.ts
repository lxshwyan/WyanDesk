import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: { target: 'es2022', sourcemap: true },
  server: {
    port: 8097,
    proxy: { '/api/desk': 'http://127.0.0.1:8098' },
  },
});
