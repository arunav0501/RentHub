import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi, clearAuth, getCurrentUser, type User } from "./api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string; role?: string }) => Promise<void>;
  demoLogin: (preset: "owner" | "renter") => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getCurrentUser());

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(getCurrentUser());
    };

    window.addEventListener("renthub_auth_changed", handleAuthChange);
    return () => window.removeEventListener("renthub_auth_changed", handleAuthChange);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setUser(res.user);
  };

  const register = async (data: { name: string; email: string; password: string; phone?: string; role?: string }) => {
    const res = await authApi.register(data);
    setUser(res.user);
  };

  const demoLogin = async (preset: "owner" | "renter") => {
    const res = await authApi.demoLogin(preset);
    setUser(res.user);
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const freshUser = await authApi.getProfile();
      setUser(freshUser);
    } catch {
      // Ignored if expired
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        demoLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
