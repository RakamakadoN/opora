import React, { createContext, useContext, useEffect, useState } from 'react';

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: 'parent' | 'doctor' | 'admin';
  createdAt: string;
};

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  error: string;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string; role: 'parent' | 'doctor' }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const clearLocalAppData = () => {
  Object.keys(localStorage)
    .filter(key => key.startsWith('opora_'))
    .forEach(key => localStorage.removeItem(key));
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then(response => response.json())
      .then(data => {
        if (!cancelled) setUser(data.user || null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const submitAuth = async (url: string, body: Record<string, unknown>) => {
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Не удалось выполнить вход.');
      }
      clearLocalAppData();
      setUser(data.user);
    } catch (authError: any) {
      setError(authError?.message || 'Не удалось выполнить вход.');
      throw authError;
    } finally {
      setIsLoading(false);
    }
  };

  const login = (email: string, password: string) => submitAuth('/api/auth/login', { email, password });

  const register = (data: { email: string; password: string; fullName: string; role: 'parent' | 'doctor' }) => (
    submitAuth('/api/auth/register', data)
  );

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      clearLocalAppData();
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      error,
      login,
      register,
      logout,
      clearError: () => setError('')
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
