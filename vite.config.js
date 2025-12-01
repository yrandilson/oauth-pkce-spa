import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { copyFileSync } from 'fs';
import { resolve } from 'path';

export default defineConfig(({ command }) => {
  const isProduction = command === 'build';
  
  return {
    plugins: [
      vue(),
      // Plugin para copiar callback.html
      {
        name: 'copy-callback',
        closeBundle() {
          if (isProduction) {
            try {
              copyFileSync(
                resolve(__dirname, 'public/callback.html'),
                resolve(__dirname, 'dist/callback.html')
              );
              console.log('✅ callback.html copiado para dist/');
            } catch (err) {
              console.warn('⚠️ Não foi possível copiar callback.html:', err.message);
            }
          }
        }
      }
    ],
    // Base URL para GitHub Pages
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
    },
    // Copia arquivos da pasta public
    publicDir: 'public'
  };
});