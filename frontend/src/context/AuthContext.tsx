'use client';

import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, clearToken, getToken, setToken } from '../api/client';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.auth.me();
      setUser(res.user);
    } catch {
      logout();
    }
  }, [logout]);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = getToken();
      if (savedToken) {
        setTokenState(savedToken);
        try {
          const res = await api.auth.me();
          setUser(res.user);
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [logout]);

  const login = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setTokenState(newToken);
    setUser(newUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
