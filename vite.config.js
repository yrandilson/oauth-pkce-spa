import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// CONFIGURAÇÃO INTELIGENTE
// Se for build (deploy), usa o nome do repositório.
// Se for serve (local), usa a raiz.
export default defineConfig(({ command }) => {
  const isProduction = command === 'build';
  return {
    plugins: [vue()],
    // ATENÇÃO: Se o nome do seu repositório mudar, mude aqui também!
    base: isProduction ? '/oauth-pkce-spa/' : '/',
    build: {
      outDir: 'dist',
    }
  };
});