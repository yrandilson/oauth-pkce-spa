/**
 * GitHub API - Funções para interagir com a API do GitHub
 * Requisito B.3: Prova de Uso com access_token
 */

import { getAccessToken } from './oauth';

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Faz uma requisição autenticada à API do GitHub
 */
async function fetchGitHub(endpoint: string, options: RequestInit = {}) {
  const token = getAccessToken();
  
  if (!token) {
    throw new Error('Token de acesso não encontrado');
  }

  const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(error.message || `Erro HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Obtém informações do usuário autenticado
 */
export async function getCurrentUser() {
  return fetchGitHub('/user');
}

/**
 * Lista os repositórios do usuário autenticado
 * Requisito: Perfil A (Viewer) - read:user
 */
export async function listRepositories(params: {
  type?: 'all' | 'owner' | 'public' | 'private' | 'member';
  sort?: 'created' | 'updated' | 'pushed' | 'full_name';
  direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
} = {}) {
  const queryParams = new URLSearchParams();
  
  if (params.type) queryParams.append('type', params.type);
  if (params.sort) queryParams.append('sort', params.sort);
  if (params.direction) queryParams.append('direction', params.direction);
  if (params.per_page) queryParams.append('per_page', params.per_page.toString());
  if (params.page) queryParams.append('page', params.page.toString());

  const query = queryParams.toString();
  const endpoint = `/user/repos${query ? `?${query}` : ''}`;
  
  return fetchGitHub(endpoint);
}

/**
 * Cria um novo repositório
 * Requisito: Perfil B (Manager) - repo
 */
export async function createRepository(data: {
  name: string;
  description?: string;
  private?: boolean;
  auto_init?: boolean;
}) {
  return fetchGitHub('/user/repos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * Interface para dados do repositório
 */
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  language: string | null;
}

/**
 * Interface para dados do usuário
 */
export interface User {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
}
