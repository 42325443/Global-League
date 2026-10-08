const API_BASE = 'http://localhost:3000/api';

export const apiUrl = (path) => `${API_BASE}${path}`;

export const apiFetch = async (path, options = {}) => {
  const response = await fetch(path.startsWith('http') ? path : apiUrl(path), {
    ...options,
    credentials: 'include',
  });

  const isAuthRequest = ['/api/auth/login', '/api/auth/registro'].some((route) => (
    (path.startsWith('http') ? new URL(path).pathname : apiUrl(path)).endsWith(route)
  ));
  if (response.status === 401 && !isAuthRequest) {
    window.dispatchEvent(new Event('global-league:session-expired'));
  }
  return response;
};
