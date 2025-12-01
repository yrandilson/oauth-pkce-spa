import { createRouter, createWebHistory } from 'vue-router';
import { storeAccessToken, clearTokenStore } from '../utils/pkce';

import LoginButton from '../components/LoginButton.vue';
import Dashboard from '../components/Dashboard.vue'; 

const TOKEN_ENDPOINT = 'https://github.com/login/oauth/access_token'; 
// URL FINAL (Não altere para testes locais, o redirecionamento sempre volta para a url pública)
const REDIRECT_URI = 'https://yrandilson.github.io/oauth-pkce-spa/'; 
const CLIENT_ID = import.meta.env.VITE_APP_CLIENT_ID;

const determineProfile = () => {
    return 'Manager'; 
};

const routes = [
  { path: '/', component: LoginButton, name: 'Login' },
  { path: '/dashboard', component: Dashboard, name: 'Dashboard' },
  { 
    path: '/:pathMatch(.*)*', 
    name: 'Callback',
    beforeEnter: async (to, from, next) => {
        const code = to.query.code;
        const returnedState = to.query.state;

        // 1. Validação de State
        const savedState = sessionStorage.getItem('state');
        if (returnedState !== savedState) {
            console.error('Erro de Segurança: State inválido.');
            clearTokenStore();
            return next('/');
        }
        sessionStorage.removeItem('state');

        if (!code) {
            clearTokenStore(); 
            return next('/');
        }

        // 2. Troca de Token (PKCE)
        const codeVerifier = sessionStorage.getItem('code_verifier');
        if (!codeVerifier) {
            console.error('Code Verifier ausente.');
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
            if (data.error) throw new Error(data.error_description || data.error);
            
            storeAccessToken(data.access_token); 
            to.meta.profile = determineProfile(); 
            
            return next('/dashboard');

        } catch (error) {
            console.error('Erro:', error);
            alert('Falha na autenticação.');
            clearTokenStore();
            return next('/');
        }
    }
  }
];

const router = createRouter({
  // MÁGICA: Lê automaticamente a 'base' definida no vite.config.js
  history: createWebHistory(import.meta.env.BASE_URL), 
  routes,
});

export default router;