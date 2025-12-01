function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.map(x => possible[x % possible.length]).join('');
}

function base64urlencode(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary) 
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, ''); 
}

async function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64urlencode(hash);
}

export async function generatePkceAndState() {
  const codeVerifier = generateRandomString(128); 
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateRandomString(32); 

  sessionStorage.setItem('code_verifier', codeVerifier);
  sessionStorage.setItem('state', state);

  return { codeChallenge, state };
}

let accessTokenStore = null; 

export function storeAccessToken(token) {
    accessTokenStore = token;
}

export function getAccessToken() {
    return accessTokenStore;
}

export function clearTokenStore() {
    accessTokenStore = null;
    sessionStorage.removeItem('code_verifier');
    sessionStorage.removeItem('state');
}