"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { login as loginApi, logout as logoutApi, getSession, setAuthToken } from "@/lib/api";

interface AuthContextType {
  isAdmin: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAdmin: false,
  isLoading: true,
  login: async () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSession()
      .then((s) => {
        setIsAdmin(s.authenticated);
      })
      .catch(() => {
        setIsAdmin(false);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (password: string): Promise<boolean> => {
    try {
      const result = await loginApi(password);
      setAuthToken(result.token);
      setIsAdmin(true);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    logoutApi().catch(() => {});
    setAuthToken(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ isAdmin, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
