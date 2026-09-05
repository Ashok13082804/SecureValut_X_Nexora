// API client for SecureAI Vault
const API_BASE = '/api/v1';

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: string;
  mfa_enabled: boolean;
  risk_score: number;
}

export const authStorage = {
  getToken: () => localStorage.getItem('secureai_token'),
  setToken: (token: string) => localStorage.setItem('secureai_token', token),
  getUser: (): User | null => {
    const raw = localStorage.getItem('secureai_user');
    return raw ? JSON.parse(raw) : null;
  },
  setUser: (user: User) => localStorage.setItem('secureai_user', JSON.stringify(user)),
  clear: () => {
    localStorage.removeItem('secureai_token');
    localStorage.removeItem('secureai_user');
  }
};

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = authStorage.getToken();
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If token invalid, optionally redirect to login
  }

  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const errData = await response.json();
      errorDetail = errData.detail || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  // Handle blob responses (e.g. PDF/CSV downloads)
  const contentType = response.headers.get('content-type');
  if (contentType && (contentType.includes('application/pdf') || contentType.includes('text/csv') || contentType.includes('application/octet-stream'))) {
    return response.blob() as any;
  }

  return response.json();
}
