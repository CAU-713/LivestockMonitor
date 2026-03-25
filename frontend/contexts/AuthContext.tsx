'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// 后端返回的用户角色映射
// role=0 → 管理员(admin), role=1 → 普通访客(guest), role=2 → 科研用户(research)
export type RoleMode = 'admin' | 'research' | 'guest';

export interface AuthUser {
  id: number;
  name: string;
  role: number;       // 后端数据库角色
  roleMode: RoleMode; // 前端展示角色
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (name: string, password: string, roleMode: RoleMode) => Promise<void>;
  loginAsGuest: (roleMode?: RoleMode) => void;
  logout: () => void;
  isAdmin: boolean;
  isResearch: boolean;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const LOCAL_STORAGE_KEY = 'auth_user';

/**
 * 将后端 role 数字映射到前端 roleMode 字符串
 * role=0 → admin, role=1 → guest, role=2 → research
 */
function mapRoleToMode(role: number): RoleMode {
  switch (role) {
    case 0: return 'admin';
    case 1: return 'guest';
    case 2: return 'research';
    default: return 'guest';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 初始化时从 localStorage 恢复登录状态
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        setUser(parsed);
      }
    } catch (e) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (name: string, password: string, roleMode: RoleMode) => {
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password, role_mode: roleMode }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || '用户名或密码错误');
    }

    const data = await response.json();
    // 后端返回的 role_mode 优先使用；如果后端没有返回，则用 role 数字推导
    const finalRoleMode: RoleMode = data.role_mode || mapRoleToMode(data.role);

    const authUser: AuthUser = {
      id: data.id,
      name: data.name,
      role: data.role,
      roleMode: finalRoleMode,
    };

    setUser(authUser);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(authUser));
  }, []);

  /**
   * 访客模式直接进入（不调用后端）
   */
  const loginAsGuest = useCallback((roleMode: RoleMode = 'guest') => {
    const quickUser: AuthUser = {
      id: 0,
      name: roleMode === 'research' ? '科研用户' : roleMode === 'admin' ? '管理员' : '访客',
      role: roleMode === 'admin' ? 0 : roleMode === 'research' ? 2 : 1,
      roleMode,
    };
    setUser(quickUser);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(quickUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    router.push('/login');
  }, [router]);

  const isAdmin = user?.roleMode === 'admin';
  const isResearch = user?.roleMode === 'research';
  const isGuest = user?.roleMode === 'guest' || !user;

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginAsGuest, logout, isAdmin, isResearch, isGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
