import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/** Proxy + dev API must match `VITE_SERVER_URL` in `client/.env` (e.g. Render or http://localhost:5000). */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_SERVER_URL || 'http://localhost:5000';

  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
        },
        '/socket.io': {
          target,
          ws: true,
          changeOrigin: true,
        },
      },
    },
  };
});