# Project TODO

## Funcionalidades Principais

- [x] Implementar fluxo OAuth 2.0 com PKCE
- [x] Gerar code_verifier e code_challenge (SHA256)
- [x] Armazenar code_verifier no sessionStorage
- [x] Implementar redirecionamento para GitHub OAuth
- [x] Implementar callback e troca de código por token
- [x] Implementar proteção CSRF com state aleatório
- [x] Validar state no callback

## Interface do Usuário

- [x] Criar página de login (index)
- [x] Criar dashboard protegido
- [x] Implementar renderização condicional baseada em scopes
- [x] Implementar funcionalidade de listar repositórios (Perfil A - read:user)
- [x] Implementar funcionalidade de criar repositórios (Perfil B - repo)
- [x] Implementar logout seguro

## Segurança

- [x] Armazenar token apenas em sessionStorage
- [x] Implementar limpeza de token no logout
- [x] Redirecionar para end_session_endpoint do GitHub

## DevOps

- [x] Criar workflow GitHub Actions (.github/workflows/deploy.yml)
- [x] Configurar CLIENT_ID como Secret
- [x] Configurar deploy automático para GitHub Pages

## Documentação

- [x] Criar README.md com instruções de configuração
- [x] Documentar decisões técnicas e de segurança
- [x] Explicar funcionamento do PKCE e validação de state
