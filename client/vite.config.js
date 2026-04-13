import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'https://uno-no-mercy-wq92.onrender.com',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'https://uno-no-mercy-wq92.onrender.com', 
        ws: true,
        changeOrigin: true,
      },
    },
  },
});