/**
 * OAuth 2.0 com PKCE - Utilitários
 * Implementação segura do fluxo Authorization Code com PKCE
 */

// Configuração do GitHub OAuth
export const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || '';
export const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
export const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
export const GITHUB_API_BASE = 'https://api.github.com';

// Chaves para sessionStorage
const STORAGE_KEYS = {
  CODE_VERIFIER: 'oauth_code_verifier',
  STATE: 'oauth_state',
  ACCESS_TOKEN: 'oauth_access_token',
  SCOPE: 'oauth_scope',
} as const;

/**
 * Gera string aleatória criptograficamente segura
 */
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Gera code_verifier para PKCE
 * Requisito: string aleatória de 43-128 caracteres
 */
export function generateCodeVerifier(): string {
  return generateRandomString(32); // 64 caracteres hexadecimais
}

/**
 * Gera code_challenge a partir do code_verifier usando SHA-256
 * Requisito A.1: HASH SHA256 do verifier
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  
  // Converter para base64url
  const hashArray = Array.from(new Uint8Array(hash));
  const base64 = btoa(String.fromCharCode(...hashArray));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Gera state aleatório para proteção CSRF
 * Requisito C: Proteção contra CSRF
 */
export function generateState(): string {
  return generateRandomString(16); // 32 caracteres hexadecimais
}

/**
 * Inicia o fluxo OAuth com PKCE
 * Requisito A.2: Redirecionamento com code_challenge
 */
export async function initiateOAuthFlow(scope: string): Promise<void> {
  // Gerar code_verifier e code_challenge
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  // Armazenar no sessionStorage
  sessionStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, codeVerifier);
  sessionStorage.setItem(STORAGE_KEYS.STATE, state);

  // Construir URL de autorização
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: window.location.origin + '/callback',
    scope: scope,
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  // Redirecionar para GitHub
  window.location.href = `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
}

/**
 * Processa o callback OAuth e troca código por token
 * Requisito A.3: Troca de Token com code_verifier
 */
export async function handleOAuthCallback(): Promise<{
  accessToken: string;
  scope: string;
}> {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');

  // Validar state (proteção CSRF)
  const storedState = sessionStorage.getItem(STORAGE_KEYS.STATE);
  if (!state || state !== storedState) {
    throw new Error('State inválido - possível ataque CSRF');
  }

  if (!code) {
    throw new Error('Código de autorização não encontrado');
  }

  // Recuperar code_verifier
  const codeVerifier = sessionStorage.getItem(STORAGE_KEYS.CODE_VERIFIER);
  if (!codeVerifier) {
    throw new Error('Code verifier não encontrado');
  }

  // Trocar código por token
  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      code: code,
      code_verifier: codeVerifier,
      redirect_uri: window.location.origin + '/callback',
    }),
  });

  if (!response.ok) {
    throw new Error('Falha ao trocar código por token');
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  // Armazenar token e scope
  sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
  sessionStorage.setItem(STORAGE_KEYS.SCOPE, data.scope);

  // Limpar dados temporários
  sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
  sessionStorage.removeItem(STORAGE_KEYS.STATE);

  return {
    accessToken: data.access_token,
    scope: data.scope,
  };
}

/**
 * Obtém o token de acesso armazenado
 */
export function getAccessToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

/**
 * Obtém os escopos concedidos
 */
export function getGrantedScopes(): string[] {
  const scope = sessionStorage.getItem(STORAGE_KEYS.SCOPE);
  return scope ? scope.split(',').map(s => s.trim()) : [];
}

/**
 * Verifica se um escopo específico foi concedido
 * Requisito B.1: Validação de Escopo
 */
export function hasScope(requiredScope: string): boolean {
  const grantedScopes = getGrantedScopes();
  return grantedScopes.includes(requiredScope);
}

/**
 * Verifica se o usuário está autenticado
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

/**
 * Faz logout seguro
 * Requisito C: Logout Seguro
 */
export function logout(): void {
  // Limpar todos os dados da sessão
  sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.SCOPE);
  sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
  sessionStorage.removeItem(STORAGE_KEYS.STATE);

  // Redirecionar para página inicial
  window.location.href = '/';
}
