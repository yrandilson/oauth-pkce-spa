import { createRouter, createWebHashHistory } from 'vue-router'; 
import { storeAccessToken, clearTokenStore, getAccessToken } from '../utils/pkce';

import LoginButton from '../components/LoginButton.vue';
import Dashboard from '../components/Dashboard.vue';

// 🔥 SOLUÇÃO CORS: Usando proxy público
// ⚠️ IMPORTANTE: Ative o proxy em https://cors-anywhere.herokuapp.com/corsdemo
const TOKEN_ENDPOINT = 'https://cors-anywhere.herokuapp.com/https://github.com/login/oauth/access_token';

// URL do GitHub Pages (deve ser exata e com barra no final)
const REDIRECT_URI = 'https://yrandilson.github.io/oauth-pkce-spa/';

// Credenciais (lidas do .env ou Secrets)
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
        alert('⚠️ Login necessário!');
        return next('/');
      }
      next();
    }
  }
];

const router = createRouter({
  // Hash Mode é obrigatório para GitHub Pages
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
});

// Guardião Global: Lógica de Login/Callback
router.beforeEach(async (to, from, next) => {
  const code = to.query.code;
  const returnedState = to.query.state;

  // Se não tem código na URL, segue normal
  if (!code) {
    return next();
  }

  console.log('🔐 Processando callback OAuth...');
  
  // Limpa a URL visualmente
  const cleanUrl = window.location.pathname + window.location.hash.split('?')[0];
  window.history.replaceState({}, document.title, cleanUrl);

  // Validação de segurança
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
    // Troca o código pelo token (com a senha/secret)
    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET, // <--- OBRIGATÓRIO
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

// 👇 AQUI ESTAVA O ERRO! ESTA LINHA É OBRIGATÓRIA 👇
export default router;