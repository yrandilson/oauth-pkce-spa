import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ command }) => {
  const isProduction = command === 'build';
  
  return {
    plugins: [vue()],
    base: isProduction ? '/oauth-pkce-spa/' : '/',
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        }
      }
    },
    server: {
      port: 3000,
      open: true
    }
  };
});