import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../config/api';
import { Expense } from '../types/expense';
import { useAuth } from './AuthContext';

const CACHE_KEY_PREFIX = 'expense-tracker/expenses/user-';

type ExpenseContextValue = {
  expenses: Expense[];
  loaded: boolean;
  syncing: boolean;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  removeExpense: (id: string) => void;
  monthlyTotal: number;
  todayTotal: number;
};

const ExpenseContext = createContext<ExpenseContextValue | undefined>(undefined);

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const cacheKey = user ? `${CACHE_KEY_PREFIX}${user.id}` : null;

  useEffect(() => {
    if (!token || !cacheKey) {
      setExpenses([]);
      setLoaded(false);
      return;
    }
    let cancelled = false;
    (async () => {
      // Show cached data immediately, then refresh from the server.
      try {
        const raw = await AsyncStorage.getItem(cacheKey);
        if (raw && !cancelled) setExpenses(JSON.parse(raw));
      } catch {}
      setSyncing(true);
      try {
        const serverExpenses = await api<Expense[]>('/api/expenses', { token });
        if (!cancelled) {
          setExpenses(serverExpenses);
          AsyncStorage.setItem(cacheKey, JSON.stringify(serverExpenses)).catch(() => {});
        }
      } catch {
        // Offline or server down — keep showing cached data.
      } finally {
        if (!cancelled) {
          setSyncing(false);
          setLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, cacheKey]);

  const persist = (next: Expense[]) => {
    if (cacheKey) AsyncStorage.setItem(cacheKey, JSON.stringify(next)).catch(() => {});
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expense,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };
    setExpenses((prev) => {
      const next = [newExpense, ...prev];
      persist(next);
      return next;
    });
    if (token) {
      api('/api/expenses', { method: 'POST', body: newExpense, token }).catch(() => {
        // Kept locally; will not retry automatically. A production app would queue this.
      });
    }
  };

  const removeExpense = (id: string) => {
    setExpenses((prev) => {
      const next = prev.filter((e) => e.id !== id);
      persist(next);
      return next;
    });
    if (token) {
      api(`/api/expenses/${id}`, { method: 'DELETE', token }).catch(() => {});
    }
  };

  const now = new Date();
  const monthlyTotal = useMemo(() => {
    return expenses
      .filter((e) => e.kind === 'expense')
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const todayTotal = useMemo(() => {
    return expenses
      .filter((e) => e.kind === 'expense')
      .filter((e) => {
        const d = new Date(e.date);
        return d.toDateString() === now.toDateString();
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  return (
    <ExpenseContext.Provider
      value={{ expenses, loaded, syncing, addExpense, removeExpense, monthlyTotal, todayTotal }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error('useExpenses must be used within ExpenseProvider');
  return ctx;
}
