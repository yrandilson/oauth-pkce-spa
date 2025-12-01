import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ command }) => {
  const isProduction = command === 'build';
  return {
    plugins: [vue()],
    // Base URL para GitHub Pages
    base: isProduction ? '/oauth-pkce-spa/' : '/',
    build: {
      outDir: 'dist',
      // Gera sourcemaps para debug
      sourcemap: false,
      // Otimizações
      rollupOptions: {
        output: {
          manualChunks: undefined,
        }
      }
    },
    // Configuração do servidor dev
    server: {
      port: 3000,
      open: true
    }
  };
});