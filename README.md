# Implementação de OAuth 2.0 (PKCE) em SPA Segura

## 📋 Descrição do Projeto

Esta aplicação é uma **Single Page Application (SPA)** que demonstra a implementação segura do fluxo **OAuth 2.0 Authorization Code com PKCE** (Proof Key for Code Exchange), integrada à **API do GitHub**. O projeto implementa controle de autorização através de **Escopos (Scopes)** e segue as melhores práticas de segurança para aplicações web modernas.

### 🎯 Cenário Implementado

**Cenário 1: GitHub Repository Manager**

- **Perfil A (Viewer)**: Escopo `read:user` - Permite listar repositórios
- **Perfil B (Manager)**: Escopos `read:user` + `repo` - Permite listar e criar repositórios
- **API Externa**: GitHub REST API v3

## 🏗️ Arquitetura e Stack Tecnológico

### Frontend
- **React 19** - Biblioteca para construção de interfaces
- **TypeScript** - Tipagem estática para maior segurança
- **Tailwind CSS 4** - Framework CSS utilitário
- **shadcn/ui** - Componentes UI acessíveis e customizáveis
- **Wouter** - Roteamento client-side leve
- **Vite** - Build tool e dev server

### Hospedagem
- **GitHub Pages** - Hospedagem estática gratuita
- **GitHub Actions** - CI/CD automatizado

## 🔐 Implementação de Segurança

### Requisito A: Fluxo PKCE (Proof Key for Code Exchange)

O PKCE é essencial para aplicações públicas (SPAs) que não podem armazenar um `client_secret` de forma segura.

#### Como funciona:

1. **Pré-Redirecionamento** (`client/src/lib/oauth.ts`):
   ```typescript
   // Gerar code_verifier (string aleatória criptograficamente segura)
   const codeVerifier = generateCodeVerifier(); // 64 caracteres hex
   
   // Gerar code_challenge (SHA-256 do verifier em base64url)
   const codeChallenge = await generateCodeChallenge(codeVerifier);
   
   // Armazenar verifier no sessionStorage
   sessionStorage.setItem('oauth_code_verifier', codeVerifier);
   ```

2. **Redirecionamento** (`initiateOAuthFlow`):
   ```typescript
   // Redirecionar para GitHub com PKCE
   const params = {
     client_id: GITHUB_CLIENT_ID,
     redirect_uri: window.location.origin + '/callback',
     scope: 'read:user' ou 'read:user repo',
     state: state, // Para proteção CSRF
     code_challenge: codeChallenge,
     code_challenge_method: 'S256' // SHA-256
   };
   ```

3. **Troca de Token** (`handleOAuthCallback`):
   ```typescript
   // Recuperar code_verifier do sessionStorage
   const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
   
   // Trocar código por token, enviando o verifier
   const response = await fetch(GITHUB_TOKEN_URL, {
     method: 'POST',
     body: JSON.stringify({
       client_id: GITHUB_CLIENT_ID,
       code: code, // Código recebido do GitHub
       code_verifier: codeVerifier // Prova de posse
     })
   });
   ```

#### Por que PKCE?

**Sem PKCE:** Um atacante que intercepta o código de autorização pode trocá-lo por um token.

**Com PKCE:** O atacante precisa também do `code_verifier`, que nunca é transmitido pela URL e só existe no sessionStorage do navegador legítimo. O servidor valida que o `code_challenge` original corresponde ao `code_verifier` enviado na troca.

### Requisito B: Controle de Autorização (Scopes)

A interface se adapta dinamicamente baseada nos escopos concedidos pelo usuário.

#### Validação de Escopo (`client/src/lib/oauth.ts`):

```typescript
export function hasScope(requiredScope: string): boolean {
  const grantedScopes = getGrantedScopes();
  return grantedScopes.includes(requiredScope);
}
```

#### Renderização Condicional (`client/src/pages/Dashboard.tsx`):

```typescript
const canRead = hasScope('read:user') || hasScope('repo');
const canWrite = hasScope('repo');

// Mostrar funcionalidade apenas se tiver permissão
{canRead && (
  <Card>
    <CardTitle>Listar Repositórios</CardTitle>
    <Button onClick={handleLoadRepositories}>
      Carregar Repositórios
    </Button>
  </Card>
)}

{canWrite && (
  <Card>
    <CardTitle>Criar Repositório</CardTitle>
    <Button onClick={() => setShowCreateForm(true)}>
      Novo Repositório
    </Button>
  </Card>
)}
```

#### Prova de Uso com API Real:

**Perfil Viewer (read:user):**
```typescript
// Listar repositórios do usuário
export async function listRepositories() {
  return fetchGitHub('/user/repos', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}
```

**Perfil Manager (repo):**
```typescript
// Criar novo repositório
export async function createRepository(data) {
  return fetchGitHub('/user/repos', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
}
```

### Requisito C: Segurança e Armazenamento

#### Proteção contra CSRF

```typescript
// Gerar state aleatório
const state = generateState(); // 32 caracteres hex

// Armazenar state antes do redirecionamento
sessionStorage.setItem('oauth_state', state);

// Validar state no callback
const storedState = sessionStorage.getItem('oauth_state');
if (!state || state !== storedState) {
  throw new Error('State inválido - possível ataque CSRF');
}
```

**Por que State?** Um atacante não pode forjar uma requisição OAuth válida porque não conhece o `state` aleatório gerado no navegador da vítima.

#### Armazenamento de Tokens

```typescript
// ✅ CORRETO: sessionStorage (limpo ao fechar aba)
sessionStorage.setItem('oauth_access_token', token);

// ❌ ERRADO: localStorage (persiste indefinidamente)
// localStorage.setItem('oauth_access_token', token);

// ✅ MELHOR: Apenas em memória (variável JavaScript)
// Implementado como alternativa no código
```

**Por que não localStorage?** Tokens em localStorage são acessíveis por qualquer script na mesma origem e persistem mesmo após fechar o navegador, aumentando a janela de exposição.

#### Logout Seguro

```typescript
export function logout(): void {
  // Limpar TODOS os dados da sessão
  sessionStorage.removeItem('oauth_access_token');
  sessionStorage.removeItem('oauth_scope');
  sessionStorage.removeItem('oauth_code_verifier');
  sessionStorage.removeItem('oauth_state');
  
  // Redirecionar para home
  window.location.href = '/';
}
```

**Nota:** O GitHub não possui um `end_session_endpoint` público para SPAs. Em produção, seria ideal revogar o token via API antes do logout.

## 🚀 DevOps e CI/CD

### Requisito: GitHub Actions com Secrets

O `CLIENT_ID` é gerenciado como **Secret** no GitHub, nunca hardcoded no código.

#### Workflow (`.github/workflows/deploy.yml`):

```yaml
jobs:
  build:
    steps:
      - name: Build
        env:
          # Injetar CLIENT_ID do Secret
          VITE_GITHUB_CLIENT_ID: ${{ secrets.VITE_GITHUB_CLIENT_ID }}
        run: pnpm run build
```

#### Por que Secrets?

Mesmo que o `CLIENT_ID` seja "público" (não é secreto como `client_secret`), usar GitHub Secrets:
- Centraliza configuração
- Permite rotação sem alterar código
- Demonstra boas práticas de DevOps
- Evita commits acidentais de credenciais

## 📦 Instalação e Configuração

### Pré-requisitos

- Node.js 20+
- pnpm 8+
- Conta no GitHub

### Passo 1: Criar OAuth App no GitHub

1. Acesse: https://github.com/settings/developers
2. Clique em **"New OAuth App"**
3. Preencha:
   - **Application name**: OAuth PKCE Demo
   - **Homepage URL**: `https://seu-usuario.github.io/oauth-spa-github`
   - **Authorization callback URL**: `https://seu-usuario.github.io/oauth-spa-github/callback`
4. Copie o **Client ID** gerado

### Passo 2: Configurar Secrets no GitHub

1. No repositório, vá em **Settings** → **Secrets and variables** → **Actions**
2. Clique em **"New repository secret"**
3. Nome: `VITE_GITHUB_CLIENT_ID`
4. Valor: Cole o Client ID copiado
5. Clique em **"Add secret"**

### Passo 3: Habilitar GitHub Pages

1. No repositório, vá em **Settings** → **Pages**
2. Em **Source**, selecione **"GitHub Actions"**
3. Salve as configurações

### Passo 4: Deploy

```bash
# Fazer commit e push para main
git add .
git commit -m "Deploy OAuth PKCE app"
git push origin main

# O GitHub Actions irá automaticamente:
# 1. Instalar dependências
# 2. Injetar VITE_GITHUB_CLIENT_ID
# 3. Fazer build da aplicação
# 4. Fazer deploy no GitHub Pages
```

### Passo 5: Desenvolvimento Local

```bash
# Instalar dependências
pnpm install

# Configurar variável de ambiente
echo "VITE_GITHUB_CLIENT_ID=seu_client_id_aqui" > .env

# Iniciar dev server
pnpm dev

# Abrir http://localhost:3000
```

**Importante:** Para desenvolvimento local, configure a callback URL no GitHub OAuth App como `http://localhost:3000/callback`.

## 🧪 Testando a Aplicação

### Teste 1: Perfil Viewer

1. Na página inicial, clique em **"Login como Viewer"**
2. Autorize a aplicação no GitHub (escopo `read:user`)
3. No dashboard:
   - ✅ Deve aparecer o botão "Carregar Repositórios"
   - ❌ NÃO deve aparecer o botão "Criar Repositório"
4. Clique em "Carregar Repositórios"
5. Verifique que seus repositórios são listados

### Teste 2: Perfil Manager

1. Faça logout
2. Na página inicial, clique em **"Login como Manager"**
3. Autorize a aplicação no GitHub (escopos `read:user` + `repo`)
4. No dashboard:
   - ✅ Deve aparecer o botão "Carregar Repositórios"
   - ✅ Deve aparecer o botão "Criar Repositório"
5. Clique em "Novo Repositório"
6. Preencha o formulário e crie um repositório de teste
7. Verifique que o repositório foi criado no GitHub

### Teste 3: Validação de Segurança

**Teste CSRF:**
1. Abra DevTools → Application → Session Storage
2. Antes do login, anote o valor de `oauth_state`
3. Durante o redirecionamento, tente modificar o parâmetro `state` na URL
4. A aplicação deve rejeitar com erro "State inválido"

**Teste PKCE:**
1. Abra DevTools → Network
2. Faça login e observe a requisição para `/login/oauth/authorize`
3. Verifique que `code_challenge` e `code_challenge_method=S256` estão presentes
4. Observe a requisição para `/login/oauth/access_token`
5. Verifique que `code_verifier` é enviado (não `client_secret`)

## 📁 Estrutura do Projeto

```
oauth-spa-github/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx           # Página de login
│   │   │   ├── Callback.tsx       # Processamento OAuth
│   │   │   └── Dashboard.tsx      # Página protegida
│   │   ├── lib/
│   │   │   ├── oauth.ts           # Lógica PKCE e OAuth
│   │   │   └── github-api.ts      # Integração com GitHub API
│   │   ├── components/ui/         # Componentes shadcn/ui
│   │   ├── App.tsx                # Rotas da aplicação
│   │   └── main.tsx               # Entry point
│   ├── public/                    # Assets estáticos
│   └── index.html
├── .github/
│   └── workflows/
│       └── deploy.yml             # CI/CD GitHub Actions
├── todo.md                        # Checklist do projeto
└── README.md                      # Este arquivo
```

## 🎓 Conceitos Aprendidos

### 1. OAuth 2.0 Authorization Code Flow

O fluxo mais seguro para aplicações web, onde o token nunca passa pelo navegador na URL.

### 2. PKCE (RFC 7636)

Extensão do OAuth 2.0 que protege contra ataques de interceptação de código, essencial para aplicações públicas.

### 3. CSRF Protection

Uso de `state` aleatório para garantir que a resposta OAuth veio de uma requisição legítima.

### 4. Principle of Least Privilege

Solicitar apenas os escopos necessários para cada perfil de usuário.

### 5. Secure Token Storage

Evitar localStorage, preferir sessionStorage ou memória para tokens sensíveis.

### 6. CI/CD Security

Gerenciar credenciais através de Secrets, nunca hardcoded no código.

## 📚 Referências

- [RFC 6749 - OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749)
- [RFC 7636 - PKCE](https://datatracker.ietf.org/doc/html/rfc7636)
- [GitHub OAuth Documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
- [OWASP OAuth Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)

## 👥 Autores

Implementação de OAuth 2.0 (PKCE) em SPA Segura  
Disciplina: Segurança

## 📄 Licença

Este projeto é desenvolvido para fins educacionais.
