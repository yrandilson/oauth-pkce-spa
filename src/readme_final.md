# 🔐 OAuth 2.0 PKCE - Single Page Application (Vue.js)

Implementação completa de OAuth 2.0 com PKCE (Proof Key for Code Exchange) usando Vue.js 3, Vue Router 4 e GitHub como provedor OAuth.

## 🎯 Objetivo do Projeto

Demonstrar a implementação segura de autenticação OAuth 2.0 com PKCE em uma SPA (Single Page Application), incluindo:
- ✅ Fluxo completo de autorização OAuth 2.0
- ✅ PKCE para segurança adicional
- ✅ Proteção contra CSRF com State
- ✅ Controle de acesso baseado em perfis (Viewer/Manager)
- ✅ Integração com API do GitHub

## 🚀 Acesso ao Projeto

**URL:** https://yrandilson.github.io/oauth-pkce-spa/

## ⚠️ IMPORTANTE - Primeiro Acesso

Para contornar limitações do CORS no GitHub Pages, este projeto usa um proxy público temporário. **Antes do primeiro login**, você precisa:

1. Acessar: https://cors-anywhere.herokuapp.com/corsdemo
2. Clicar em **"Request temporary access to the demo server"**
3. Voltar ao site e fazer login normalmente

> 💡 Este acesso dura algumas horas e precisa ser renovado apenas quando expirar.

## 🏗️ Arquitetura

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │────────▶│  GitHub      │────────▶│   GitHub    │
│   (SPA)     │◀────────│  OAuth       │◀────────│   API       │
└─────────────┘         └──────────────┘         └─────────────┘
       │                       │
       │                       ▼
       │              ┌──────────────┐
       └─────────────▶│ CORS Proxy   │
                      │ (temporário) │
                      └──────────────┘
```

## 🔒 Fluxo de Autenticação

1. **Usuário clica em "Login"**
   - Gera Code Verifier (128 chars aleatórios)
   - Calcula Code Challenge (SHA-256 + Base64URL)
   - Gera State (32 chars aleatórios para CSRF)
   - Armazena verifier e state no sessionStorage

2. **Redirecionamento para GitHub**
   ```
   https://github.com/login/oauth/authorize?
     client_id=XXX&
     redirect_uri=https://yrandilson.github.io/oauth-pkce-spa/&
     scope=read:user repo&
     response_type=code&
     code_challenge=YYY&
     code_challenge_method=S256&
     state=ZZZ
   ```

3. **Usuário autoriza no GitHub**
   - GitHub valida os parâmetros
   - Usuário autoriza o acesso
   - GitHub redireciona de volta com `code` e `state`

4. **SPA processa callback**
   - Valida State (proteção CSRF)
   - Recupera Code Verifier
   - Troca `code` por `access_token` via proxy
   - Armazena token em memória (não em localStorage!)

5. **Acesso autorizado**
   - Dashboard liberado
   - Chamadas à API GitHub autenticadas

## 🛠️ Tecnologias Utilizadas

- **Vue.js 3** - Framework JavaScript reativo
- **Vue Router 4** - Roteamento SPA com Hash History
- **Vite** - Build tool moderno e rápido
- **GitHub OAuth** - Provedor de autenticação
- **GitHub Pages** - Hospedagem estática gratuita
- **GitHub Actions** - CI/CD automático

## 📁 Estrutura do Projeto

```
oauth-pkce-spa/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD automático
├── public/
│   └── .nojekyll              # Desabilita Jekyll no Pages
├── src/
│   ├── components/
│   │   ├── LoginButton.vue    # Botão de login OAuth
│   │   └── Dashboard.vue      # Área protegida
│   ├── router/
│   │   └── index.js           # Rotas e lógica OAuth
│   ├── utils/
│   │   └── pkce.js            # Funções PKCE e storage
│   ├── App.vue                # Componente raiz
│   └── main.js                # Entry point
├── index.html                  # HTML principal com redirect
├── package.json
├── vite.config.js             # Configuração Vite/build
└── README.md
```

## 🔐 Segurança Implementada

### 1. PKCE (Proof Key for Code Exchange)
- **Code Verifier**: String aleatória de 128 caracteres
- **Code Challenge**: SHA-256(Code Verifier) em Base64URL
- **Proteção**: Previne ataques de interceptação de código

### 2. State Parameter (CSRF Protection)
- Valor aleatório de 32 caracteres
- Validado no callback para prevenir CSRF
- Armazenado em sessionStorage

### 3. Token em Memória
- Access token **nunca** armazenado em localStorage
- Mantido apenas em variável JavaScript
- Perdido ao fechar/recarregar (comportamento esperado)

### 4. Validações Implementadas
```javascript
✅ State válido (CSRF)
✅ Code Verifier presente (PKCE)
✅ Token recebido do GitHub
✅ Autorização antes de acessar rotas protegidas
```

## 🎮 Funcionalidades

### Perfil Viewer (Apenas Leitura)
- ✅ Listar repositórios do usuário
- ✅ Visualizar dados do perfil
- ❌ Criar repositórios

### Perfil Manager (Leitura e Escrita)
- ✅ Listar repositórios
- ✅ Criar novos repositórios
- ✅ Acesso completo à API

## 🚦 Como Rodar Localmente

### Pré-requisitos
- Node.js 18+ e npm
- Conta no GitHub
- OAuth App configurado

### Passo 1: Clone o repositório
```bash
git clone https://github.com/yrandilson/oauth-pkce-spa.git
cd oauth-pkce-spa
```

### Passo 2: Instale dependências
```bash
npm install
```

### Passo 3: Configure variáveis de ambiente
Crie um arquivo `.env` na raiz:
```env
VITE_APP_CLIENT_ID=seu_client_id_aqui
```

### Passo 4: Execute o servidor dev
```bash
npm run dev
```

Acesse: http://localhost:3000

> ⚠️ **Nota**: O OAuth só funciona com a URL de produção. Localmente você pode testar a interface, mas o login redirecionará para a URL pública.

## 🌐 Deploy

O projeto usa GitHub Actions para deploy automático:

1. **Push para `main`** → Trigger automático
2. **Build** → `npm run build`
3. **Deploy** → Branch `gh-pages`
4. **GitHub Pages** → Publica automaticamente

### Configuração necessária:

1. **GitHub Secret** `AUTH_CLIENT_ID`:
   - Repository Settings → Secrets and variables → Actions
   - New repository secret: `AUTH_CLIENT_ID`

2. **GitHub Pages**:
   - Repository Settings → Pages
   - Source: `Deploy from a branch`
   - Branch: `gh-pages` / `(root)`

3. **OAuth App**:
   - https://github.com/settings/developers
   - Homepage URL: `https://yrandilson.github.io/oauth-pkce-spa/`
   - Callback URL: `https://yrandilson.github.io/oauth-pkce-spa/`

## 🐛 Troubleshooting

### Erro: "redirect_uri not registered"
**Causa**: URL de callback não cadastrada no OAuth App  
**Solução**: Verifique se a URL está **exatamente igual** (com `/` final)

### Erro: CORS blocked
**Causa**: Proxy não ativado ou expirado  
**Solução**: Acesse https://cors-anywhere.herokuapp.com/corsdemo e ative novamente

### Erro: State inválido
**Causa**: Possível ataque CSRF ou sessionStorage limpo  
**Solução**: Tente fazer login novamente

### Página 404
**Causa**: GitHub Pages não encontra arquivos  
**Solução**: Verifique se `.nojekyll` existe e se o deploy foi concluído

## 📚 Referências

- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Vue.js Documentation](https://vuejs.org/)
- [Vue Router Documentation](https://router.vuejs.org/)

## 📝 Licença

Este projeto é livre para uso educacional.

## 👨‍💻 Autor

**Yrandilson**  
GitHub: [@yrandilson](https://github.com/yrandilson)

---

⭐ Se este projeto foi útil, considere dar uma estrela no repositório!