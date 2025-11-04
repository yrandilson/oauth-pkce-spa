import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Shield, Lock, Key } from "lucide-react";
import { initiateOAuthFlow, isAuthenticated } from "@/lib/oauth";
import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Página de Login - Ponto de partida da aplicação
 * Requisito: Página pública com botão de login
 */
export default function Home() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirecionar para dashboard se já estiver autenticado
    if (isAuthenticated()) {
      setLocation('/dashboard');
    }
  }, [setLocation]);

  const handleLogin = async (profile: 'viewer' | 'manager') => {
    try {
      // Definir scopes baseado no perfil
      const scope = profile === 'viewer' 
        ? 'read:user' 
        : 'read:user repo';
      
      await initiateOAuthFlow(scope);
    } catch (error) {
      console.error('Erro ao iniciar OAuth:', error);
      alert('Erro ao iniciar autenticação. Verifique o console.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">OAuth 2.0 PKCE</h1>
              <p className="text-xs text-slate-600">GitHub Integration Demo</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-900 mb-6">
              <Github className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Implementação Segura de OAuth 2.0
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Demonstração de autenticação OAuth 2.0 com PKCE (Proof Key for Code Exchange) 
              integrada à API do GitHub, implementando controle de autorização através de Escopos.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">PKCE Flow</CardTitle>
                </div>
                <CardDescription>
                  Fluxo Authorization Code com PKCE para aplicações públicas sem client_secret
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <CardTitle className="text-lg">Proteção CSRF</CardTitle>
                </div>
                <CardDescription>
                  Validação de state aleatório para prevenir ataques Cross-Site Request Forgery
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Key className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-lg">Controle de Escopos</CardTitle>
                </div>
                <CardDescription>
                  Interface adaptativa baseada em permissões OAuth concedidas pelo usuário
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Login Options */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Perfil Viewer */}
            <Card className="border-2 hover:border-blue-500 transition-colors">
              <CardHeader>
                <CardTitle className="text-2xl">Perfil Viewer</CardTitle>
                <CardDescription className="text-base">
                  Permissões de leitura para visualizar repositórios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold text-slate-700">Escopo OAuth:</p>
                  <code className="text-sm bg-white px-2 py-1 rounded border">read:user</code>
                  <p className="text-sm text-slate-600 mt-2">
                    ✓ Listar repositórios<br />
                    ✗ Criar repositórios
                  </p>
                </div>
                <Button 
                  onClick={() => handleLogin('viewer')}
                  className="w-full"
                  size="lg"
                  variant="outline"
                >
                  <Github className="w-5 h-5 mr-2" />
                  Login como Viewer
                </Button>
              </CardContent>
            </Card>

            {/* Perfil Manager */}
            <Card className="border-2 hover:border-green-500 transition-colors">
              <CardHeader>
                <CardTitle className="text-2xl">Perfil Manager</CardTitle>
                <CardDescription className="text-base">
                  Permissões completas para gerenciar repositórios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold text-slate-700">Escopos OAuth:</p>
                  <div className="space-x-2">
                    <code className="text-sm bg-white px-2 py-1 rounded border">read:user</code>
                    <code className="text-sm bg-white px-2 py-1 rounded border">repo</code>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    ✓ Listar repositórios<br />
                    ✓ Criar repositórios
                  </p>
                </div>
                <Button 
                  onClick={() => handleLogin('manager')}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Github className="w-5 h-5 mr-2" />
                  Login como Manager
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Security Notice */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              🔒 Esta aplicação implementa as melhores práticas de segurança OAuth 2.0
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm py-6">
        <div className="container mx-auto px-4 text-center text-sm text-slate-600">
          <p>Implementação de OAuth 2.0 (PKCE) em SPA Segura</p>
          <p className="mt-1">Disciplina: Segurança</p>
        </div>
      </footer>
    </div>
  );
}
