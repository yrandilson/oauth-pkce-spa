<template>
  <div>
    <h2>Bem-vindo! 👋</h2>
    
    <!-- Aviso importante sobre o proxy -->
    <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
      <h3 style="margin-top: 0; color: #856404;">⚠️ Atenção - Primeira vez?</h3>
      <p style="margin: 10px 0;">Para o login funcionar, você precisa ativar o proxy CORS:</p>
      <ol style="margin: 10px 0; padding-left: 20px;">
        <li>Abra: <a href="https://cors-anywhere.herokuapp.com/corsdemo" target="_blank" style="color: #0066cc;">cors-anywhere.herokuapp.com/corsdemo</a></li>
        <li>Clique em <strong>"Request temporary access to the demo server"</strong></li>
        <li>Volte aqui e clique em Login</li>
      </ol>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #856404;">
        💡 Isso precisa ser feito apenas uma vez (dura algumas horas)
      </p>
    </div>

    <button 
      @click="handleLogin" 
      :disabled="isLoading" 
      style="padding: 15px 30px; font-size: 16px; cursor: pointer; background: #28a745; color: white; border: none; border-radius: 5px;"
    >
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
const REDIRECT_URI = 'https://yrandilson.github.io/oauth-pkce-spa/';
const SCOPES = 'read:user repo'; 
const AUTH_URL = 'https://github.com/login/oauth/authorize';

const debugInfo = ref(null);
const isLoading = ref(false);

const handleLogin = async () => {
    console.log('🚀 Iniciando processo de login...');
    
    // DEBUG: Verifica CLIENT_ID
    console.log('🔑 CLIENT_ID disponível:', CLIENT_ID ? 'SIM' : 'NÃO');
    console.log('🔑 CLIENT_ID valor:', CLIENT_ID?.substring(0, 15) + '...');
    console.log('🔑 CLIENT_ID length:', CLIENT_ID?.length);
    
    if (!CLIENT_ID) {
        console.error('❌ CLIENT_ID não configurado!');
        alert("❌ Erro: CLIENT_ID não encontrado.\n\n" +
              "Verifique se o Secret AUTH_CLIENT_ID está configurado no GitHub:\n" +
              "Settings → Secrets and variables → Actions\n\n" +
              "Depois, faça um novo deploy (push).");
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