<template>
  <button @click="handleLogin">
    Login com GitHub (Perfil Manager)
  </button>
</template>

<script setup>
import { generatePkceAndState } from '../utils/pkce';

const CLIENT_ID = import.meta.env.VITE_APP_CLIENT_ID; 
const REDIRECT_URI = 'https://yrandilson.github.io/oauth-pkce-spa/'; 
const SCOPES = 'read:user repo:write'; 
const AUTH_URL = 'https://github.com/login/oauth/authorize';

const handleLogin = async () => {
    if (!CLIENT_ID) {
        alert("Erro: CLIENT_ID não encontrado. Verifique os Secrets do GitHub.");
        return;
    }

    const { codeChallenge, state } = await generatePkceAndState();
    const authUrl = new URL(AUTH_URL);
    
    authUrl.searchParams.append('client_id', CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('scope', SCOPES);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256'); 
    authUrl.searchParams.append('state', state);

    window.location.href = authUrl.toString();
};
</script>