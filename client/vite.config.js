import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,          // Same port as CRA
    open: true,          // Auto open browser
    proxy: {
      // Proxy API calls to backend
      '/api': {
        target: 'http://localhost:5100',
        changeOrigin: true,
      },
      // Proxy Socket.IO to backend
      '/socket.io': {
        target: 'http://localhost:5100',
        ws: true,          // ⚠️ Important for WebSocket
        changeOrigin: true,
      },
    },
  },
});