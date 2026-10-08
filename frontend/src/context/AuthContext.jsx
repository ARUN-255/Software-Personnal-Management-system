import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
const C = createContext();
export function AuthProvider({
  children
}) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    api('/auth/session').then(setUser).catch(() => {}).finally(() => setLoading(false));
  }, []);
  async function login(data) {
    const u = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    setUser(u);
    return u;
  }
  async function logout() {
    await api('/auth/logout', {
      method: 'POST'
    });
    setUser(null);
  }
  return <C.Provider value={{
    user,
    loading,
    login,
    logout
  }}>
    {children}
  </C.Provider>;
}
export const useAuth = () => useContext(C);
