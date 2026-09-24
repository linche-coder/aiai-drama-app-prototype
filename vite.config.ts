import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Optional real backend; no fallback media, payment or permission bypass.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'AIAI_');
  const target = env.AIAI_API_TARGET;
  const proxy = target ? { '/api/v1': { target, changeOrigin: true } } : undefined;
  return { base: process.env.AIAI_BASE || env.AIAI_BASE || '/', plugins: [react()], server: { proxy }, preview: { proxy } };
});
