import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      port: 5173,
      // En desarrollo, /api/* se reenvía al backend: no hay problemas de CORS
      proxy: {
        '/api': { target: env.BACKEND_URL || 'http://localhost:3000', changeOrigin: true },
      },
    },
    build: {
      rollupOptions: {
        // Dos páginas: la aplicación y la sala de videollamada (/sala.html)
        input: { main: resolve(__dirname, 'index.html'), sala: resolve(__dirname, 'sala.html') },
      },
    },
  };
});
