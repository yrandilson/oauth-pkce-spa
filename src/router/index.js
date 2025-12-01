import { createRouter, createWebHashHistory } from 'vue-router'; 
import { storeAccessToken, clearTokenStore, getAccessToken } from '../utils/pkce';

import LoginButton from '../components/LoginButton.vue';
import Dashboard from '../components/Dashboard.vue';

// 🔥 SOLUÇÃO CORS: Usando proxy público
// ⚠️ IMPORTANTE: Acesse https://cors-anywhere.herokuapp.com/corsdemo 
//    e clique em "Request temporary access" ANTES de testar!
const TOKEN_ENDPOINT = 'https://cors-anywhere.herokuapp.com/https://github.com/login/oauth/access_token';

// Certifique-se que esta URL é IGUAL à do GitHub Developer
const REDIRECT_URI = 'https://yrandilson.github.io/oauth-pkce-spa/';

const CLIENT_ID = import.meta.env.VITE_APP_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_APP_CLIENT_SECRET; // <--- CORREÇÃO 1: Importar a senha

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
  // Hash Mode é vital para o GitHub Pages
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
});

// Guard global: processa callback OAuth em qualquer rota
router.beforeEach(async (to, from, next) => {
  // Captura parâmetros OAuth do callback
  const code = to.query.code;
  const returnedState = to.query.state;

  // Se não há código OAuth, continua navegação normal
  if (!code) {
    return next();
  }

  // 🔐 CALLBACK OAUTH DETECTADO
  console.log('🔐 Processando callback OAuth...');
  
  // Remove query params da URL (limpa a barra de endereço visualmente)
  const cleanUrl = window.location.pathname + window.location.hash.split('?')[0];
  window.history.replaceState({}, document.title, cleanUrl);

  // 1️⃣ VALIDAÇÃO DE STATE (proteção CSRF)
  const savedState = sessionStorage.getItem('state');
  if (returnedState !== savedState) {
    alert('❌ Erro de segurança: State inválido.');
    clearTokenStore();
    return next('/');
  }
  sessionStorage.removeItem('state');

  // 2️⃣ RECUPERA CODE VERIFIER (PKCE)
  const codeVerifier = sessionStorage.getItem('code_verifier');
  if (!codeVerifier) {
    alert('❌ Erro: Code Verifier ausente.');
    clearTokenStore();
    return next('/');
  }
  sessionStorage.removeItem('code_verifier');

  // 3️⃣ TROCA CODE POR TOKEN (via proxy CORS)
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
        client_secret: CLIENT_SECRET, // <--- CORREÇÃO 2: Enviar a senha para o GitHub
        code: code,
        code_verifier: codeVerifier,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();

    // Verifica erros do GitHub
    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    // 4️⃣ SUCESSO! Armazena token e redireciona
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
```

### 🚀 Últimos Passos

1.  **Atualize o arquivo** no seu computador com o código acima.
2.  **Faça o Push:**
    ```powershell
    git add .
    git commit -m "fix: adiciona client_secret ao payload"
    git push