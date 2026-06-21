import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    api
      .get('/auth/me')
      .then((response) => setUser(response.data.user))
      .catch(() => {
        localStorage.removeItem('bankikhata_token');
        setUser(null);
      })
      .finally(() => setBooting(false));
  }, []);

  async function login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('bankikhata_token', response.data.token);
    setUser(response.data.user);
  }

  async function logout() {
    await api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('bankikhata_token');
    setUser(null);
  }

  const value = useMemo(() => ({ user, booting, login, logout }), [user, booting]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
