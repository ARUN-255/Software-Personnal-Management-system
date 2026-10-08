const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
export async function api(path, options = {}) {
  const isForm = options.body instanceof FormData;
  const res = await fetch(BASE + path, {
    credentials: 'include',
    ...options,
    headers: {
      ...(isForm ? {} : {
        'Content-Type': 'application/json'
      }),
      ...options.headers
    }
  });
  if (!res.ok) {
    let e = {};
    try {
      e = await res.json();
    } catch {}
    throw new Error(e.message || `Request failed (${res.status})`);
  }
  if (res.status === 204 || !res.headers.get('content-type')?.includes('json')) return null;
  return res.json();
}
export const fileUrl = id => `${BASE}/documents/${id}/download`;
