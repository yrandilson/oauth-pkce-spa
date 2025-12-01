import { createRouter, createWebHashHistory } from 'vue-router'; 
import { storeAccessToken, clearTokenStore, getAccessToken } from '../utils/pkce';

import LoginButton from '../components/LoginButton.vue';
import Dashboard from '../components/Dashboard.vue';

// 🔥 SOLUÇÃO CORS: Usando proxy público
// ⚠️ IMPORTANTE: Acesse https://cors-anywhere.herokuapp.com/corsdemo 
//    e clique em "Request temporary access" ANTES de testar!
const TOKEN_ENDPOINT = 'https://cors-anywhere.herokuapp.com/https://github.com/login/oauth/access_token';

const REDIRECT_URI = 'https://yrandilson.github.io/oauth-pkce-spa/';
const CLIENT_ID = import.meta.env.VITE_APP_CLIENT_ID;

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
    // Protege a rota - só acessa com token
    beforeEnter: (to, from, next) => {
      const token = getAccessToken();
      if (!token) {
        alert('⚠️ Você precisa fazer login primeiro!');
        return next('/');
      }
      next();
    }
  }
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
});

// Guard global: processa callback OAuth em qualquer rota
router.beforeEach(async (to, from, next) => {
  console.log('🧭 Navegando:', from.path, '→', to.path);
  
  // Captura parâmetros OAuth do callback
  const code = to.query.code;
  const returnedState = to.query.state;

  // Se não há código OAuth, continua navegação normal
  if (!code) {
    return next();
  }

  // 🔐 CALLBACK OAUTH DETECTADO
  console.log('🔐 Processando callback OAuth...');
  console.log('📦 Code:', code.substring(0, 10) + '...');
  console.log('🎲 State:', returnedState?.substring(0, 10) + '...');

  // Remove query params da URL (limpa a barra de endereço)
  const cleanUrl = window.location.pathname + window.location.hash.split('?')[0];
  window.history.replaceState({}, document.title, cleanUrl);

  // 1️⃣ VALIDAÇÃO DE STATE (proteção CSRF)
  const savedState = sessionStorage.getItem('state');
  if (returnedState !== savedState) {
    console.error('❌ State inválido! Possível ataque CSRF');
    console.error('Recebido:', returnedState);
    console.error('Esperado:', savedState);
    alert('❌ Erro de segurança detectado (State inválido).\nTente fazer login novamente.');
    clearTokenStore();
    return next('/');
  }
  
  console.log('✅ State validado');
  sessionStorage.removeItem('state');

  // 2️⃣ RECUPERA CODE VERIFIER (PKCE)
  const codeVerifier = sessionStorage.getItem('code_verifier');
  if (!codeVerifier) {
    console.error('❌ Code Verifier não encontrado!');
    alert('❌ Erro na autenticação (Code Verifier ausente).\nTente fazer login novamente.');
    clearTokenStore();
    return next('/');
  }
  
  console.log('✅ Code Verifier recuperado');
  sessionStorage.removeItem('code_verifier');

  // 3️⃣ TROCA CODE POR TOKEN (via proxy CORS)
  console.log('🔄 Trocando code por token...');
  console.log('📍 Endpoint:', TOKEN_ENDPOINT);

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
        code: code,
        code_verifier: codeVerifier,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    console.log('📥 Response status:', response.status);

    const data = await response.json();
    console.log('📥 Response data:', data.error || 'Success');

    // Verifica erros do GitHub
    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    // Verifica se o token foi recebido
    if (!data.access_token) {
      throw new Error('Token não foi retornado pelo GitHub');
    }

    // 4️⃣ SUCESSO! Armazena token e redireciona
    console.log('✅ Token recebido:', data.access_token.substring(0, 20) + '...');
    storeAccessToken(data.access_token);
    
    console.log('✅ Autenticação completa! Redirecionando para dashboard...');
    return next('/dashboard');

  } catch (error) {
    console.error('❌ ERRO na autenticação:', error);

    // Mensagens específicas para cada tipo de erro
    let errorMessage = error.message;
    
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      errorMessage = '⚠️ Erro de CORS!\n\n' +
                     'Você precisa ativar o proxy temporário:\n\n' +
                     '1. Acesse: https://cors-anywhere.herokuapp.com/corsdemo\n' +
                     '2. Clique em "Request temporary access"\n' +
                     '3. Tente fazer login novamente\n\n' +
                     'Este acesso dura algumas horas.';
    } else if (error.message.includes('bad_verification_code')) {
      errorMessage = 'Código de autorização inválido ou expirado.\nTente fazer login novamente.';
    }

    alert(`❌ Falha na autenticação:\n\n${errorMessage}`);
    clearTokenStore();
    return next('/');
  }
});

export default router;

/* 
📚 DOCUMENTAÇÃO:

✅ O QUE FOI FEITO:
- Adicionado proxy CORS (cors-anywhere) para contornar bloqueio do GitHub
- Validação completa de State (proteção CSRF)
- Implementação PKCE (Code Verifier)
- Logs detalhados para debug
- Tratamento robusto de erros
- Limpeza automática da URL após callback

⚠️ REQUISITOS:
1. Ativar proxy em: https://cors-anywhere.herokuapp.com/corsdemo
2. CLIENT_ID configurado nos Secrets do GitHub
3. Callback URL no OAuth App: https://yrandilson.github.io/oauth-pkce-spa/

🎯 PARA PRODUÇÃO:
Este proxy é temporário. Para produção, implemente:
- Netlify Functions
- Cloudflare Workers  
- Ou qualquer backend próprio

📖 REFERÊNCIAS:
- OAuth 2.0 PKCE: https://oauth.net/2/pkce/
- CORS Anywhere: https://github.com/Rob--W/cors-anywhere
*/