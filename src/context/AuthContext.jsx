import { createContext, useContext, useState, useCallback } from 'react';
import { loginUser, registerUser } from '../utils/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem('toto-current-user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (username, password) => {
    const result = await loginUser(username, password);
    if (result.success) {
      setUser(result.user);
      sessionStorage.setItem('toto-current-user', JSON.stringify(result.user));
    }
    return result;
  }, []);

  const register = useCallback(async (fullname, username, password) => {
    const result = await registerUser(fullname, username, password);
    if (result.success) {
      // Notify DataContext to refresh
      window.dispatchEvent(new Event('toto-data-changed'));
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('toto-current-user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
