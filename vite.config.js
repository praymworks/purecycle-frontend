import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default ({ mode }) => {
  // Load env variables
  const env = loadEnv(mode, process.cwd(), '');

  return defineConfig({
    plugins: [react()],
    server: {
      port: parseInt(env.VITE_PORT) || 5173, // fallback kung walang env
    },
  });
};