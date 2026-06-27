import { createContext, useContext, useState, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hms_user')); } catch { return null; }
  });

  const login = useCallback(async (credentials) => {
    const res = await authService.login(credentials);
    const { token, username, email, role } = res.data.data;
    localStorage.setItem('hms_token', token);
    const userData = { username, email, role };
    localStorage.setItem('hms_user', JSON.stringify(userData));
    setUser(userData);
    return res.data;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authService.register(data);
    const { token, username, email, role } = res.data.data;
    localStorage.setItem('hms_token', token);
    const userData = { username, email, role };
    localStorage.setItem('hms_user', JSON.stringify(userData));
    setUser(userData);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
