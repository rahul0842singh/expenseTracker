import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, ApiError } from '../config/api';

const TOKEN_KEY = 'expense-tracker/auth/token';
const USER_KEY = 'expense-tracker/auth/user';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  monthlyBudget: number | null;
};

type AuthResult = { devOtp?: string };

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  resendOtp: (email: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateBudget: (monthlyBudget: number) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export class NeedsVerificationError extends Error {
  email: string;
  devOtp?: string;

  constructor(email: string, devOtp?: string) {
    super('Email not verified');
    this.email = email;
    this.devOtp = devOtp;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (storedToken) setToken(storedToken);
        if (storedUser) setUser(JSON.parse(storedUser));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persistSession = async (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, newToken),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser)),
    ]);
  };

  const register = async (name: string, email: string, password: string): Promise<AuthResult> => {
    const res = await api<{ devOtp?: string }>('/api/auth/register', {
      method: 'POST',
      body: { name, email, password },
    });
    return { devOtp: res.devOtp };
  };

  const verifyOtp = async (email: string, code: string) => {
    const res = await api<{ token: string; user: AuthUser }>('/api/auth/verify-otp', {
      method: 'POST',
      body: { email, code },
    });
    await persistSession(res.token, res.user);
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await api<{ token: string; user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      await persistSession(res.token, res.user);
    } catch (err) {
      if (err instanceof ApiError && err.data.needsVerification) {
        throw new NeedsVerificationError(email, err.data.devOtp as string | undefined);
      }
      throw err;
    }
  };

  const resendOtp = async (email: string): Promise<AuthResult> => {
    const res = await api<{ devOtp?: string }>('/api/auth/resend-otp', {
      method: 'POST',
      body: { email },
    });
    return { devOtp: res.devOtp };
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await Promise.all([AsyncStorage.removeItem(TOKEN_KEY), AsyncStorage.removeItem(USER_KEY)]);
  };

  const updateBudget = async (monthlyBudget: number) => {
    const updatedUser = await api<AuthUser>('/api/user/budget', {
      method: 'PUT',
      body: { monthlyBudget },
      token,
    });
    setUser(updatedUser);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{ token, user, loading, register, verifyOtp, login, resendOtp, logout, updateBudget }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
