import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, setClientToken, getClientToken } from '../api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (nameOrEmail: string, emailOrPass?: string, pass?: string) => Promise<void>;
  signup: (name: string, email: string, pass: string, seedSample?: boolean) => Promise<void>;
  logout: () => void;
  loadDemoData: () => Promise<void>;
  resetToEmptyData: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getClientToken());
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    try {
      const existingToken = getClientToken();
      if (existingToken) {
        setTokenState(existingToken);
        const res = await api.getMe();
        setUser(res.user);
      } else {
        setTokenState(null);
        setUser(null);
      }
    } catch (err) {
      console.warn('Session verification failed, clearing token:', err);
      setClientToken(null);
      setTokenState(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (nameOrEmail: string, emailOrPass?: string, pass?: string) => {
    let name = '';
    let email = '';
    let password = '';

    if (pass !== undefined) {
      // Called with 3 arguments: (name, email, password)
      name = nameOrEmail;
      email = emailOrPass || '';
      password = pass;
    } else if (emailOrPass !== undefined) {
      // Called with 2 arguments
      if (nameOrEmail.includes('@')) {
        // (email, password)
        email = nameOrEmail;
        password = emailOrPass;
      } else {
        // (name, email or password)
        name = nameOrEmail;
        if (emailOrPass.includes('@')) {
          email = emailOrPass;
        } else {
          password = emailOrPass;
        }
      }
    } else {
      // Called with 1 argument: (name) or (email)
      if (nameOrEmail.includes('@')) {
        email = nameOrEmail;
      } else {
        name = nameOrEmail;
      }
    }

    const res = await api.login({ name, email, password });
    setTokenState(res.token);
    setUser(res.user);
  };

  const signup = async (name: string, email: string, pass: string, seedSample: boolean = false) => {
    const res = await api.signup({ name, email, password: pass, seedSample });
    setTokenState(res.token);
    setUser(res.user);
  };

  const logout = () => {
    setClientToken(null);
    setTokenState(null);
    setUser(null);
  };

  const loadDemoData = async () => {
    await api.seedDemo();
    await refreshUser();
  };

  const resetToEmptyData = async () => {
    await api.resetData();
    await refreshUser();
  };

  const refreshUser = async () => {
    if (getClientToken()) {
      const res = await api.getMe();
      setUser(res.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        loadDemoData,
        resetToEmptyData,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
