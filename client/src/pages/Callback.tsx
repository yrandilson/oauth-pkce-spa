import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { handleOAuthCallback } from "@/lib/oauth";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Página de Callback OAuth
 * Processa o retorno do GitHub e troca código por token
 */
export default function Callback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Verificar se há erro na URL
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get('error');
        
        if (errorParam) {
          const errorDescription = urlParams.get('error_description') || errorParam;
          throw new Error(errorDescription);
        }

        // Processar callback e trocar código por token
        await handleOAuthCallback();
        
        // Redirecionar para dashboard após sucesso
        setLocation('/dashboard');
      } catch (err) {
        console.error('Erro no callback OAuth:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setProcessing(false);
      }
    };

    processCallback();
  }, [setLocation]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md border-2 border-red-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Erro na Autenticação</CardTitle>
                <CardDescription>Não foi possível completar o login</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <Button 
              onClick={() => setLocation('/')}
              className="w-full"
              variant="outline"
            >
              Voltar para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-full max-w-md border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <div>
              <CardTitle className="text-xl">Processando Autenticação</CardTitle>
              <CardDescription>Validando credenciais e obtendo permissões...</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
              <span>Validando state (proteção CSRF)</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
              <span>Trocando código por token (PKCE)</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
              <span>Verificando escopos concedidos</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
