import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { isAuthenticated, hasScope, logout, getGrantedScopes } from "@/lib/oauth";
import { getCurrentUser, listRepositories, createRepository, User, Repository } from "@/lib/github-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Github, LogOut, Eye, Plus, Loader2, ExternalLink, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";

/**
 * Dashboard - Página protegida com controle de autorização
 * Requisito B.2: Renderização Condicional baseada em Escopos
 */
export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Estado para criação de repositório
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDescription, setNewRepoDescription] = useState('');
  const [newRepoPrivate, setNewRepoPrivate] = useState(false);

  // Verificar escopos
  const canRead = hasScope('read:user') || hasScope('repo');
  const canWrite = hasScope('repo');
  const grantedScopes = getGrantedScopes();

  useEffect(() => {
    // Redirecionar se não estiver autenticado
    if (!isAuthenticated()) {
      setLocation('/');
      return;
    }

    // Carregar dados do usuário
    const loadUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        toast.error('Erro ao carregar dados do usuário');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [setLocation]);

  const handleLoadRepositories = async () => {
    setLoadingRepos(true);
    try {
      const repos = await listRepositories({ 
        sort: 'updated', 
        direction: 'desc',
        per_page: 10 
      });
      setRepositories(repos);
      toast.success(`${repos.length} repositórios carregados`);
    } catch (error) {
      console.error('Erro ao carregar repositórios:', error);
      toast.error('Erro ao carregar repositórios');
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleCreateRepository = async () => {
    if (!newRepoName.trim()) {
      toast.error('Nome do repositório é obrigatório');
      return;
    }

    setCreating(true);
    try {
      const newRepo = await createRepository({
        name: newRepoName,
        description: newRepoDescription || undefined,
        private: newRepoPrivate,
        auto_init: true,
      });
      
      toast.success('Repositório criado com sucesso!');
      
      // Limpar formulário
      setNewRepoName('');
      setNewRepoDescription('');
      setNewRepoPrivate(false);
      setShowCreateForm(false);
      
      // Adicionar novo repo à lista
      setRepositories(prev => [newRepo, ...prev]);
    } catch (error) {
      console.error('Erro ao criar repositório:', error);
      toast.error('Erro ao criar repositório');
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {user?.avatar_url && (
                <img 
                  src={user.avatar_url} 
                  alt={user.login}
                  className="w-10 h-10 rounded-full border-2 border-slate-200"
                />
              )}
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  {user?.name || user?.login}
                </h1>
                <p className="text-xs text-slate-600">
                  {canWrite ? '🔓 Manager' : '👁️ Viewer'} • {user?.public_repos} repos públicos
                </p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Scopes Info */}
        <Card className="mb-6 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {canWrite ? <Unlock className="w-5 h-5 text-green-600" /> : <Lock className="w-5 h-5 text-blue-600" />}
              Permissões OAuth Concedidas
            </CardTitle>
            <CardDescription>
              Escopos autorizados pelo usuário durante o login
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {grantedScopes.map(scope => (
                <span 
                  key={scope}
                  className="px-3 py-1 bg-slate-100 border border-slate-300 rounded-full text-sm font-mono"
                >
                  {scope}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Listar Repositórios - Perfil A (Viewer) */}
          {canRead && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Listar Repositórios
                </CardTitle>
                <CardDescription>
                  Visualizar seus repositórios do GitHub (read:user)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleLoadRepositories}
                  disabled={loadingRepos}
                  className="w-full"
                >
                  {loadingRepos ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <Github className="w-4 h-4 mr-2" />
                      Carregar Repositórios
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Criar Repositório - Perfil B (Manager) */}
          {canWrite && (
            <Card className="border-2 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-green-600" />
                  Criar Repositório
                </CardTitle>
                <CardDescription>
                  Criar novo repositório no GitHub (repo)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {showCreateForm ? 'Cancelar' : 'Novo Repositório'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Create Repository Form */}
        {showCreateForm && canWrite && (
          <Card className="mb-6 border-2 border-green-200">
            <CardHeader>
              <CardTitle>Criar Novo Repositório</CardTitle>
              <CardDescription>Preencha os dados do novo repositório</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="repo-name">Nome do Repositório *</Label>
                <Input
                  id="repo-name"
                  placeholder="meu-projeto-incrivel"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="repo-description">Descrição</Label>
                <Textarea
                  id="repo-description"
                  placeholder="Uma breve descrição do projeto..."
                  value={newRepoDescription}
                  onChange={(e) => setNewRepoDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="repo-private"
                  checked={newRepoPrivate}
                  onCheckedChange={setNewRepoPrivate}
                />
                <Label htmlFor="repo-private">Repositório Privado</Label>
              </div>

              <Button 
                onClick={handleCreateRepository}
                disabled={creating}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Repositório
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Repositories List */}
        {repositories.length > 0 && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Seus Repositórios</CardTitle>
              <CardDescription>
                {repositories.length} repositório{repositories.length !== 1 ? 's' : ''} encontrado{repositories.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {repositories.map(repo => (
                  <div 
                    key={repo.id}
                    className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border hover:border-slate-300 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{repo.name}</h3>
                        {repo.private && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Private
                          </span>
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-sm text-slate-600 mb-2">{repo.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        {repo.language && (
                          <span>📝 {repo.language}</span>
                        )}
                        <span>⭐ {repo.stargazers_count}</span>
                        <span>🍴 {repo.forks_count}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(repo.html_url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {repositories.length === 0 && !loadingRepos && (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Github className="w-16 h-16 text-slate-300 mb-4" />
              <p className="text-slate-600 text-center">
                Clique em "Carregar Repositórios" para visualizar seus repos
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
