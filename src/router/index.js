import { createRouter, createWebHashHistory } from 'vue-router';
import { storeAccessToken, clearTokenStore, getAccessToken } from '../utils/pkce';

import LoginButton from '../components/LoginButton.vue';
import Dashboard from '../components/Dashboard.vue'; 

const TOKEN_ENDPOINT = 'https://github.com/login/oauth/access_token'; 
const REDIRECT_URI = 'https://yrandilson.github.io/oauth-pkce-spa/'; 
const CLIENT_ID = import.meta.env.VITE_APP_CLIENT_ID;

const determineProfile = () => {
    return 'Manager'; 
};

// Função auxiliar para processar callback
async function processOAuthCallback(code, state) {
    console.log('🔄 Processando callback OAuth...');
    console.log('📦 Code recebido:', code?.substring(0, 10) + '...');
    console.log('🎲 State recebido:', state?.substring(0, 10) + '...');

    // 1. Validação de State
    const savedState = sessionStorage.getItem('state');
    console.log('🎲 State salvo:', savedState?.substring(0, 10) + '...');
    
    if (state !== savedState) {
        console.error('❌ Erro de Segurança: State inválido!');
        console.error('State recebido:', state);
        console.error('State esperado:', savedState);
        throw new Error('State inválido - possível ataque CSRF');
    }
    
    console.log('✅ State validado com sucesso');
    sessionStorage.removeItem('state');

    // 2. Recupera Code Verifier
    const codeVerifier = sessionStorage.getItem('code_verifier');
    if (!codeVerifier) {
        console.error('❌ Code Verifier ausente!');
        throw new Error('Code Verifier não encontrado');
    }
    
    console.log('✅ Code Verifier encontrado:', codeVerifier.substring(0, 10) + '...');
    sessionStorage.removeItem('code_verifier');

    // 3. Troca Code por Token
    console.log('🔄 Iniciando troca de token...');
    console.log('📍 Endpoint:', TOKEN_ENDPOINT);
    console.log('🔑 Client ID:', CLIENT_ID?.substring(0, 10) + '...');
    
    const requestBody = {
        client_id: CLIENT_ID,
        code: code,
        code_verifier: codeVerifier,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
    };
    
    console.log('📤 Request body:', {
        ...requestBody,
        code: code.substring(0, 10) + '...',
        code_verifier: codeVerifier.substring(0, 10) + '...',
    });

    const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json' 
        },
        body: JSON.stringify(requestBody),
    });

    console.log('📥 Response status:', response.status);
    
    const data = await response.json();
    console.log('📥 Response data:', data);
    
    if (data.error) {
        console.error('❌ Erro do GitHub:', data.error);
        console.error('❌ Descrição:', data.error_description);
        throw new Error(data.error_description || data.error);
    }
    
    if (!data.access_token) {
        console.error('❌ Token não recebido!');
        console.error('Response completa:', data);
        throw new Error('Access token não foi retornado pelo GitHub');
    }
    
    console.log('✅ Token recebido com sucesso!');
    console.log('🔑 Token:', data.access_token.substring(0, 20) + '...');
    
    return data.access_token;
}

const routes = [
  { 
    path: '/', 
    component: LoginButton, 
    name: 'Login',
    beforeEnter: async (to, from, next) => {
        console.log('🏠 Rota raiz acessada');
        console.log('📍 Query params:', to.query);
        
        const code = to.query.code;
        const state = to.query.state;

        // Se não há código, apenas mostra a tela de login
        if (!code) {
            console.log('📝 Exibindo tela de login');
            return next();
        }

        // Se há código, processa o callback
        console.log('🔐 Callback OAuth detectado!');
        
        try {
            const accessToken = await processOAuthCallback(code, state);
            storeAccessToken(accessToken);
            
            console.log('✅ Autenticação completa! Redirecionando para dashboard...');
            
            // Remove query params da URL
            window.history.replaceState({}, '', window.location.pathname + window.location.hash.split('?')[0]);
            
            return next('/dashboard');
            
        } catch (error) {
            console.error('❌ ERRO na autenticação:', error);
            alert(`❌ Falha na autenticação:\n\n${error.message}\n\nVerifique o console para mais detalhes.`);
            clearTokenStore();
            
            // Remove query params da URL
            window.history.replaceState({}, '', window.location.pathname + window.location.hash.split('?')[0]);
            
            return next('/');
        }
    }
  },
  { 
    path: '/dashboard', 
    component: Dashboard, 
    name: 'Dashboard',
    meta: { profile: 'Manager' },
    beforeEnter: (to, from, next) => {
        console.log('🔒 Verificando acesso ao dashboard...');
        
        const token = getAccessToken();
        if (!token) {
            console.warn('⚠️ Sem token! Redirecionando para login...');
            alert('⚠️ Você precisa fazer login primeiro!');
            return next('/');
        }
        
        console.log('✅ Token válido. Acesso permitido ao dashboard');
        next();
    }
  }
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
});

// Log de navegação global
router.beforeEach((to, from, next) => {
    console.log('🧭 Navegando de', from.path, 'para', to.path);
    next();
});

export default router;