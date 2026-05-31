'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'admin' | 'profissional' | 'recepcionista';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  clinicaId: string;
  clinicaNome: string;
}

export interface RegisterData {
  clinicaNome: string;
  cnpj: string;
  emailAdmin: string;
  senha: string;
  nomeResponsavel: string;
  telefone: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = 'clinica_session';
const USERS_KEY = 'clinica_users';
const CLINICAS_KEY = 'clinica_clinicas';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  profissional: 'Profissional',
  recepcionista: 'Recepcionista',
};

export { ROLE_LABELS };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        if (session.expiresAt > Date.now()) {
          setUser(session.user);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, senha: string) => {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      if (!raw) {
        return { success: false, error: 'Nenhuma conta cadastrada. Crie uma conta primeiro.' };
      }
      const users: Array<User & { senha: string }> = JSON.parse(raw);
      const found = users.find((u) => u.email === email && u.senha === senha);
      if (!found) {
        return { success: false, error: 'Email ou senha incorretos.' };
      }
      const { senha: _, ...userWithoutPassword } = found;
      const session = { user: userWithoutPassword, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setUser(userWithoutPassword);
      return { success: true };
    } catch {
      return { success: false, error: 'Erro interno. Tente novamente.' };
    }
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const register = async (data: RegisterData) => {
    try {
      const clinicasRaw = localStorage.getItem(CLINICAS_KEY);
      const clinicas = clinicasRaw ? JSON.parse(clinicasRaw) : [];

      if (clinicas.find((c: { cnpj: string }) => c.cnpj === data.cnpj)) {
        return { success: false, error: 'CNPJ já cadastrado.' };
      }

      const clinicaId = crypto.randomUUID();
      clinicas.push({
        id: clinicaId,
        nome: data.clinicaNome,
        cnpj: data.cnpj,
        emailAdmin: data.emailAdmin,
        nomeResponsavel: data.nomeResponsavel,
        telefone: data.telefone,
      });
      localStorage.setItem(CLINICAS_KEY, JSON.stringify(clinicas));

      const usersRaw = localStorage.getItem(USERS_KEY);
      const users = usersRaw ? JSON.parse(usersRaw) : [];

      if (users.find((u: { email: string }) => u.email === data.emailAdmin)) {
        return { success: false, error: 'Email já cadastrado.' };
      }

      const newUser = {
        id: crypto.randomUUID(),
        nome: data.nomeResponsavel,
        email: data.emailAdmin,
        senha: data.senha,
        role: 'admin' as UserRole,
        clinicaId,
        clinicaNome: data.clinicaNome,
      };
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));

      const { senha: _, ...userWithoutPassword } = newUser;
      const session = { user: userWithoutPassword, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setUser(userWithoutPassword);

      return { success: true };
    } catch {
      return { success: false, error: 'Erro interno. Tente novamente.' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
