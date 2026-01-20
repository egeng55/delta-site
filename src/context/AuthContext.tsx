"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const storedUser = localStorage.getItem("delta-current-user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("delta-current-user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const users = JSON.parse(localStorage.getItem("delta-users") || "[]");
      const foundUser = users.find(
        (u: any) => u.email === email && u.password === password
      );

      if (!foundUser) {
        return false;
      }

      const sessionUser = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
      };

      localStorage.setItem("delta-current-user", JSON.stringify(sessionUser));
      setUser(sessionUser);
      return true;
    } catch (e) {
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const users = JSON.parse(localStorage.getItem("delta-users") || "[]");

      if (users.find((u: any) => u.email === email)) {
        return false;
      }

      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      localStorage.setItem("delta-users", JSON.stringify(users));

      const sessionUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      };

      localStorage.setItem("delta-current-user", JSON.stringify(sessionUser));
      setUser(sessionUser);
      return true;
    } catch (e) {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("delta-current-user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
