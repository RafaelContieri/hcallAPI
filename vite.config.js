// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8089', // URL do seu backend local
        changeOrigin: true,
      }
    }
  }
});
