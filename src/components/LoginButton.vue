<template>
  <div>
    <h2>Bem-vindo!</h2>
    <button @click="handleLogin" :disabled="isLoading" style="padding: 15px 30px; font-size: 16px; cursor: pointer;">
      {{ isLoading ? '⏳ Preparando...' : '🔐 Login com GitHub (Perfil Manager)' }}
    </button>
    
    <div v-if="debugInfo" style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 5px; border-left: 4px solid #2196f3;">
      <h3 style="margin-top: 0;">🔍 Informações de Debug:</h3>
      <div style="font-size: 13px; font-family: monospace;">
        <div v-for="(value, key) in debugInfo" :key="key" style="margin: 5px 0;">
          <strong>{{ key }}:</strong> {{ value }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { generatePkceAndState } from '../utils/pkce';

const CLIENT_ID = import.meta.env.VITE_APP_CLIENT_ID; 
const REDIRECT_URI = 'https://yrandilson.github.io/oauth-pkce-spa/callback.html';
const SCOPES = 'read:user repo'; 
const AUTH_URL = 'https://github.com/login/oauth/authorize';

const debugInfo = ref(null);
const isLoading = ref(false);

const handleLogin = async () => {
    console.log('🚀 Iniciando processo de login...');
    
    if (!CLIENT_ID) {
        console.error('❌ CLIENT_ID não configurado!');
        alert("❌ Erro: CLIENT_ID não encontrado.\n\nVerifique se o Secret AUTH_CLIENT_ID está configurado no GitHub.");
        return;
    }

    isLoading.value = true;

    try {
        console.log('🔐 Gerando PKCE challenge e state...');
        const { codeChallenge, state } = await generatePkceAndState();
        
        console.log('✅ PKCE gerado:');
        console.log('  - Challenge:', codeChallenge.substring(0, 20) + '...');
        console.log('  - State:', state.substring(0, 20) + '...');
        
        const authUrl = new URL(AUTH_URL);
        
        authUrl.searchParams.append('client_id', CLIENT_ID);
        authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
        authUrl.searchParams.append('scope', SCOPES);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('code_challenge', codeChallenge);
        authUrl.searchParams.append('code_challenge_method', 'S256'); 
        authUrl.searchParams.append('state', state);

        debugInfo.value = {
            '✅ CLIENT_ID': CLIENT_ID.substring(0, 15) + '...',
            '✅ REDIRECT_URI': REDIRECT_URI,
            '✅ SCOPES': SCOPES,
            '✅ State': state.substring(0, 20) + '...',
            '🔗 Auth URL': authUrl.toString().substring(0, 80) + '...'
        };

        console.log('📍 URL de autorização completa:', authUrl.toString());
        console.log('🚀 Redirecionando para GitHub em 1 segundo...');

        // Redireciona após 1 segundo
        setTimeout(() => {
            console.log('➡️ Redirecionando agora...');
            window.location.href = authUrl.toString();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erro ao gerar PKCE:', error);
        alert(`❌ Erro ao iniciar login: ${error.message}`);
        isLoading.value = false;
    }
};
</script>