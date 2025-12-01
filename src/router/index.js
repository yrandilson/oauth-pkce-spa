import { createRouter, createWebHashHistory } from 'vue-router'; 
import { storeAccessToken, clearTokenStore, getAccessToken } from '../utils/pkce';

import LoginButton from '../components/LoginButton.vue';
import Dashboard from '../components/Dashboard.vue';

// Endpoint com Proxy para contornar CORS
const TOKEN_ENDPOINT = 'https://cors-anywhere.herokuapp.com/https://github.com/login/oauth/access_token';

// URL do teu GitHub Pages (tem de ser exata)
const REDIRECT_URI = 'https://yrandilson.github.io/oauth-pkce-spa/';

// As chaves secretas vêm do .env ou do GitHub Secrets
const CLIENT_ID = import.meta.env.VITE_APP_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_APP_CLIENT_SECRET;

const determineProfile = () => {
    return 'Manager';
};

const routes = [
  { 
    path: '/', 
    component: LoginButton, 
    name: 'Login' 
  },
  { 
    path: '/dashboard', 
    component: Dashboard, 
    name: 'Dashboard',
    meta: { profile: 'Manager' },
    beforeEnter: (to, from, next) => {
      const token = getAccessToken();
      if (!token) {
        alert('⚠️ Precisas de fazer login primeiro!');
        return next('/');
      }
      next();
    }
  }
];

const router = createRouter({
  // Hash Mode (#) para funcionar no GitHub Pages
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const code = to.query.code;
  const returnedState = to.query.state;

  if (!code) {
    return next();
  }

  // Limpa a URL visualmente
  const cleanUrl = window.location.pathname + window.location.hash.split('?')[0];
  window.history.replaceState({}, document.title, cleanUrl);

  const savedState = sessionStorage.getItem('state');
  if (returnedState !== savedState) {
    alert('❌ Erro de segurança: State inválido.');
    clearTokenStore();
    return next('/');
  }
  sessionStorage.removeItem('state');

  const codeVerifier = sessionStorage.getItem('code_verifier');
  if (!codeVerifier) {
    alert('❌ Erro: Code Verifier ausente.');
    clearTokenStore();
    return next('/');
  }
  sessionStorage.removeItem('code_verifier');

  try {
    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET, // Obrigatório
        code: code,
        code_verifier: codeVerifier,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    storeAccessToken(data.access_token);
    alert('✅ Login realizado com sucesso!');
    return next('/dashboard');

  } catch (error) {
    console.error('❌ ERRO:', error);
    alert(`❌ Falha na autenticação:\n${error.message}`);
    clearTokenStore();
    return next('/');
  }
});

export default router;