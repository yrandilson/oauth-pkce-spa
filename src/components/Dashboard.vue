<template>
  <div>
    <h2>🔒 Dashboard Privada - Perfil: {{ profile }}</h2>
    <p>Seu Access Token está seguro na memória.</p>
    <hr/>
    <h3>Funcionalidades de Leitura (Perfil A)</h3>
    <button @click="handleListRepos">Listar Repositórios (GET)</button>
    
    <template v-if="profile === 'Manager'">
      <hr/>
      <h3>Funcionalidades de Escrita (Perfil B)</h3>
      <button @click="handleCreateRepo">Criar Repositório (POST)</button>
    </template>
    <template v-else>
       <p>Você é Viewer. Sem acesso de escrita.</p>
    </template>
    
    <hr/>
    <button @click="handleLogout" style="background-color: red; color: white;">Logout</button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getAccessToken, clearTokenStore } from '../utils/pkce';

const router = useRouter();
const route = useRoute();
const API_BASE = 'https://api.github.com';
const profile = computed(() => route.meta.profile || 'Viewer'); 

const handleApiCall = async (action, endpoint, method, body = null) => {
    const accessToken = getAccessToken();
    if (!accessToken) return handleLogout();

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: method,
            headers: {
                'Authorization': `Bearer ${accessToken}`, 
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : null,
        });

        if (!response.ok) throw new Error(`Status: ${response.status}`);
        const data = await response.json();
        
        console.log(`${action} - Sucesso:`, data);
        alert(`${action} realizado com sucesso!`);

    } catch (error) {
        console.error(`Erro em ${action}:`, error);
        alert(`Erro: ${error.message}`);
    }
};

const handleListRepos = () => handleApiCall('Listar', '/user/repos', 'GET');

const handleCreateRepo = () => {
    const repoName = `vue-repo-${Date.now()}`;
    handleApiCall('Criar', '/user/repos', 'POST', { 
        name: repoName, 
        description: "Teste OAuth PKCE" 
    });
};

const handleLogout = () => {
    clearTokenStore(); 
    router.push('/');
};
</script>