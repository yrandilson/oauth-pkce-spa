<template>
  <div>
    <h2>Bem-vindo!</h2>
    <button @click="handleLogin" style="padding: 15px 30px; font-size: 16px; cursor: pointer;">
      🔐 Login com GitHub (Perfil Manager)
    </button>
    
    <div v-if="debugInfo" style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 5px;">
      <h3>🔍 Debug Info:</h3>
      <pre style="font-size: 12px; overflow-x: auto;">{{ debugInfo }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { generatePkceAndState } from '../utils/pkce';

const CLIENT_ID = import.meta.env.VITE_APP_CLIENT_ID; 
const REDIRECT_URI = 'https://yrandilson.github.io/oauth-pkce-spa/';
const SCOPES = 'read:user repo'; 
const AUTH_URL = 'https://github.com/login/oauth/authorize';

const debugInfo = ref(null);

const handleLogin = async () => {
    if (!CLIENT_ID) {
        alert("❌ Erro: CLIENT_ID não encontrado. Verifique os Secrets do GitHub.");
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

    // DEBUG: Mostra informações antes de redirecionar
    debugInfo.value = {
        'CLIENT_ID': CLIENT_ID ? '✅ Configurado' : '❌ Não encontrado',
        'REDIRECT_URI': REDIRECT_URI,
        'SCOPES': SCOPES,
        'Auth URL': authUrl.toString()
    };

    console.log('🔍 Debug - Configuração OAuth:', {
        CLIENT_ID,
        REDIRECT_URI,
        SCOPES,
        authUrl: authUrl.toString()
    });

    // Aguarda 2 segundos para você ver o debug
    setTimeout(() => {
        console.log('🚀 Redirecionando para GitHub...');
        window.location.href = authUrl.toString();
    }, 2000);
};
</script>