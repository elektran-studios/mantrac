interface LoginResponse {
  status: number;
  cause: string | null;
  username: string;
  token: string;
  usertype: number;
  nickname: string;
  [key: string]: any;
}

export const AUTH_TOKEN_KEY = 'mantrac_auth_token';
export const AUTH_USER_KEY = 'mantrac_user_data';

export function saveAuthToken(token: string, userData: LoginResponse): void {
  if (typeof window !== 'undefined') {
    // Use sessionStorage for tab-isolated sessions (prevents cross-tab interference)
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
    
    // Also set cookie for middleware
    document.cookie = `mantrac_auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
}

export function getUserData(): LoginResponse | null {
  if (typeof window !== 'undefined') {
    const data = sessionStorage.getItem(AUTH_USER_KEY);
    return data ? JSON.parse(data) : null;
  }
  return null;
}

export function clearAuth(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    
    // Clear cookie
    document.cookie = 'mantrac_auth_token=; path=/; max-age=0';
  }
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

// Function to handle API requests with token and auto-redirect on expiration
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  
  if (!token) {
    // Redirect to login if no token
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    throw new Error('No authentication token');
  }

  // Add token to headers
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Check if token expired (typically 401 or 403)
  if (response.status === 401 || response.status === 403) {
    clearAuth();
    if (typeof window !== 'undefined') {
      window.location.href = '/?error=session_expired';
    }
    throw new Error('Session expired');
  }

  return response;
}
