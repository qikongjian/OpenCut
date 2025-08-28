/**
 * 兼容video-flow认证系统的适配器
 * 将better-auth的功能适配为video-flow top-bar所需的接口
 */

import { useSession } from "@opencut/auth/client";

// 用户接口定义
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  token?: string;
}

// 存储键
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'currentUser';

/**
 * 获取当前用户信息
 */
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

/**
 * 设置用户信息
 */
export const setUser = (user: User) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * 获取token
 */
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * 设置token
 */
export const setToken = (token: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * 清除认证数据
 */
export const clearAuthData = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * 用户登出
 */
export const logoutUser = () => {
  clearAuthData();
  window.location.href = '/login';
};

/**
 * 检查是否已登录
 */
export const isAuthenticated = (): boolean => {
  return !!getToken() || !!getCurrentUser()?.token;
};

/**
 * 使用better-auth session的hook适配器
 */
export const useAuthSession = () => {
  const { data: session, isPending } = useSession();
  
  // 如果有better-auth session，同步到localStorage
  if (session?.user && typeof window !== 'undefined') {
    const user: User = {
      id: session.user.id,
      name: session.user.name || session.user.email || 'User',
      email: session.user.email || '',
      avatar: session.user.image || undefined,
    };
    
    // 同步到localStorage以兼容video-flow的top-bar
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.id !== user.id) {
      setUser(user);
    }
  }
  
  return {
    user: session?.user ? {
      id: session.user.id,
      name: session.user.name || session.user.email || 'User',
      email: session.user.email || '',
      avatar: session.user.image || undefined,
    } : getCurrentUser(),
    isLoading: isPending,
    isAuthenticated: !!session?.user || isAuthenticated(),
  };
};
