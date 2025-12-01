import { createRouter, createWebHashHistory } from 'vue-router'; // MUDANÇA: Hash History
import { storeAccessToken, clearTokenStore } from '../utils/pkce';

import LoginButton from '../components/LoginButton.vue';
import Dashboard from '../components/Dashboard.vue'; 

const TOKEN_ENDPOINT = 'https://github.com/login/oauth/access_token'; 
const REDIRECT_URI = 'https://yrandilson.github.io/oauth-pkce-spa/'; 
const CLIENT_ID = import.meta.env.VITE_APP_CLIENT_ID;

const determineProfile = () => {
    return 'Manager'; 
};

const routes = [
  { 
    path: '/', 
    component: LoginButton, 
    name: 'Login',
    beforeEnter: async (to, from, next) => {
        // Verifica se há parâmetros de callback na URL
        const code = to.query.code;
        const returnedState = to.query.state;

        // Se não há código, exibe a tela de login
        if (!code) {
            return next();
        }

        // CALLBACK: Processa o retorno do OAuth
        const savedState = sessionStorage.getItem('state');
        if (returnedState !== savedState) {
            console.error('Erro de Segurança: State inválido.');
            clearTokenStore();
            alert('Erro de segurança detectado. Tente novamente.');
            return next('/');
        }
        sessionStorage.removeItem('state');

        const codeVerifier = sessionStorage.getItem('code_verifier');
        if (!codeVerifier) {
            console.error('Code Verifier ausente.');
            alert('Erro na autenticação. Tente novamente.');
            return next('/');
        }
        sessionStorage.removeItem('code_verifier');

        try {
            const response = await fetch(TOKEN_ENDPOINT, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json' 
                },
                body: JSON.stringify({
                    client_id: CLIENT_ID,
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
            
            if (!data.access_token) {
                throw new Error('Access token não recebido');
            }
            
            storeAccessToken(data.access_token); 
            console.log('✅ Autenticação bem-sucedida!');
            
            return next('/dashboard');

        } catch (error) {
            console.error('❌ Erro na troca do token:', error);
            alert(`Falha na autenticação: ${error.message}`);
            clearTokenStore();
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
        // Verifica se há token antes de acessar o dashboard
        const { getAccessToken } = require('../utils/pkce');
        if (!getAccessToken()) {
            alert('Você precisa fazer login primeiro!');
            return next('/');
        }
        next();
    }
  }
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL), // HASH MODE para GitHub Pages
  routes,
});

export default router;