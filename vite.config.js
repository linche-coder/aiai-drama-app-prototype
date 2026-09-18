import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Optional real backend; no fallback media, payment or permission bypass.
export default defineConfig(({ mode }) => {
  const target = loadEnv(mode, '.', 'AIAI_').AIAI_API_TARGET;
  const proxy = target ? { '/api/v1': { target, changeOrigin: true } } : undefined;
  return { plugins: [react()], server: { proxy }, preview: { proxy } };
});
