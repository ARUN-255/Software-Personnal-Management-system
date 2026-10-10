const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
let csrfPromise;
async function csrfToken() {
  if (!csrfPromise) {
    csrfPromise = fetch(`${BASE}/auth/csrf`, {
      credentials: 'include'
    }).then(async response => {
      if (!response.ok) throw new Error('Unable to initialize a secure session');
      return (await response.json()).token;
    }).catch(error => {
      csrfPromise = undefined;
      throw error;
    });
  }
  return csrfPromise;
}
export async function api(path, options = {}) {
  const isForm = options.body instanceof FormData;
  const method = (options.method || 'GET').toUpperCase();
  const token = ['GET', 'HEAD', 'OPTIONS'].includes(method) ? null : await csrfToken();
  const response = await fetch(BASE + path, {
    ...options,
    credentials: 'include',
    headers: {
      ...(isForm ? {} : {
        'Content-Type': 'application/json'
      }),
      ...(token ? {
        'X-CSRF-TOKEN': token
      } : {}),
      'X-App-Language': localStorage.getItem('spms-language') || 'en',
      ...options.headers
    }
  });
  if (path === '/auth/logout' || path === '/auth/login' || response.status === 403) csrfPromise = undefined;
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || (response.status === 401 ? 'Please sign in again' : `Request failed (${response.status})`));
  }
  if (response.status === 204 || !response.headers.get('content-type')?.includes('json')) return null;
  return response.json();
}
export const fileUrl = id => `${BASE}/documents/${id}/download`;
export const downloadUrl = path => `${BASE}${path}`;
