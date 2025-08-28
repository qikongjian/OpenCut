/**
 * AI剪辑计划API的健全token处理系统
 * 结合video-flow项目的认证机制，支持多种token获取方式
 */

import { getToken, setToken, clearAuthData, checkAuth } from "./auth-compat";

// Token存储键
const AI_API_TOKEN_KEY = 'ai_editing_api_token';
const TOKEN_EXPIRY_KEY = 'ai_editing_token_expiry';

// Token来源类型
export type TokenSource = 'localStorage' | 'url' | 'session' | 'better-auth';

// Token信息接口
export interface TokenInfo {
  token: string;
  source: TokenSource;
  expiresAt?: number;
  userId?: string;
}

/**
 * 从URL参数获取token
 * 支持多种URL参数名称：token, access_token, auth_token, api_token
 */
export function getTokenFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  
  // 支持多种token参数名称
  const tokenParams = ['token', 'access_token', 'auth_token', 'api_token', 'ai_token'];
  
  for (const param of tokenParams) {
    const token = urlParams.get(param);
    if (token) {
      console.log(`🔑 从URL参数 "${param}" 获取到token:`, token.substring(0, 10) + '...');
      return token;
    }
  }
  
  return null;
}

/**
 * 从URL hash获取token（支持OAuth回调等场景）
 */
export function getTokenFromHash(): string | null {
  if (typeof window === 'undefined') return null;
  
  const hash = window.location.hash.substring(1);
  const hashParams = new URLSearchParams(hash);
  
  const tokenParams = ['access_token', 'token', 'auth_token'];
  
  for (const param of tokenParams) {
    const token = hashParams.get(param);
    if (token) {
      console.log(`🔑 从URL hash "${param}" 获取到token:`, token.substring(0, 10) + '...');
      return token;
    }
  }
  
  return null;
}

/**
 * 保存AI API专用token
 */
export function setAIApiToken(token: string, expiresIn?: number): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(AI_API_TOKEN_KEY, token);
  
  if (expiresIn) {
    const expiryTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  }
  
  console.log('💾 AI API token已保存到localStorage');
}

/**
 * 获取AI API专用token
 */
export function getAIApiToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem(AI_API_TOKEN_KEY);
  const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (token && expiryStr) {
    const expiryTime = parseInt(expiryStr);
    if (Date.now() > expiryTime) {
      // Token已过期，清除
      localStorage.removeItem(AI_API_TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      console.log('⏰ AI API token已过期，已清除');
      return null;
    }
  }
  
  return token;
}

/**
 * 清除AI API token
 */
export function clearAIApiToken(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(AI_API_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  console.log('🗑️ AI API token已清除');
}

/**
 * 智能获取token - 按优先级尝试多种来源
 */
export async function getSmartToken(): Promise<TokenInfo | null> {
  console.log('🔍 开始智能token获取...');
  
  // 1. 优先从URL获取token（最高优先级，用于分享链接等场景）
  const urlToken = getTokenFromUrl();
  if (urlToken) {
    // 保存到localStorage以便后续使用
    setAIApiToken(urlToken);
    return {
      token: urlToken,
      source: 'url'
    };
  }
  
  // 2. 从URL hash获取token（OAuth回调场景）
  const hashToken = getTokenFromHash();
  if (hashToken) {
    setAIApiToken(hashToken);
    return {
      token: hashToken,
      source: 'url'
    };
  }
  
  // 3. 从AI API专用存储获取
  const aiApiToken = getAIApiToken();
  if (aiApiToken) {
    return {
      token: aiApiToken,
      source: 'localStorage'
    };
  }
  
  // 4. 从video-flow认证系统获取
  const videoFlowToken = getToken();
  if (videoFlowToken) {
    // 验证token是否有效
    const isValid = await checkAuth();
    if (isValid) {
      return {
        token: videoFlowToken,
        source: 'localStorage'
      };
    } else {
      console.log('❌ video-flow token无效');
    }
  }
  
  // 5. 从sessionStorage获取（临时会话）
  if (typeof window !== 'undefined') {
    const sessionToken = sessionStorage.getItem('ai_api_token');
    if (sessionToken) {
      return {
        token: sessionToken,
        source: 'session'
      };
    }
  }
  
  console.log('❌ 未找到有效的token');
  return null;
}

/**
 * 创建带有智能token处理的请求头
 */
export async function createAuthHeaders(): Promise<Record<string, string>> {
  const tokenInfo = await getSmartToken();
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  
  if (tokenInfo) {
    // 统一使用标准的Authorization Bearer格式，与video-flow项目保持一致
    headers['Authorization'] = `Bearer ${tokenInfo.token}`;

    // 为了兼容性，某些特殊来源可能需要不同格式
    switch (tokenInfo.source) {
      case 'session':
        // session来源使用自定义格式
        headers['X-AI-API-TOKEN'] = tokenInfo.token;
        break;
      default:
        // 其他所有来源都使用标准Bearer格式
        headers['Authorization'] = `Bearer ${tokenInfo.token}`;
        break;
    }
    
    console.log(`🔐 使用${tokenInfo.source}来源的token创建请求头`);
  } else {
    console.log('⚠️ 未找到token，将发送无认证请求');
  }
  
  return headers;
}

/**
 * 带有智能token处理的fetch封装
 */
export async function authFetchWithSmartToken(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = await createAuthHeaders();
  
  const mergedHeaders = {
    ...authHeaders,
    ...options.headers,
  };
  
  console.log('📡 发送带认证的请求:', {
    url: url.replace(/token=[^&]+/g, 'token=***'),
    method: options.method || 'GET',
    hasAuth: Object.keys(authHeaders).some(key => key.toLowerCase().includes('token') || key.toLowerCase().includes('authorization'))
  });
  
  const response = await fetch(url, {
    ...options,
    headers: mergedHeaders,
  });
  
  // 处理认证失败
  if (response.status === 401) {
    console.log('🔒 认证失败，尝试清除过期token');
    
    try {
      const errorData = await response.clone().json();
      
      // 如果是token过期，清除相关token
      if (errorData.code === '401' || errorData.message?.includes('token')) {
        clearAIApiToken();
        clearAuthData();
        
        // 可以选择重定向到登录页面
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          console.log('🔄 重定向到登录页面');
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
        }
      }
    } catch (e) {
      console.log('⚠️ 无法解析401响应');
    }
  }
  
  return response;
}

/**
 * 从URL清除token参数（用于安全考虑）
 */
export function cleanTokenFromUrl(): void {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  const tokenParams = ['token', 'access_token', 'auth_token', 'api_token', 'ai_token'];
  
  let hasTokenParam = false;
  tokenParams.forEach(param => {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      hasTokenParam = true;
    }
  });
  
  // 清除hash中的token
  if (url.hash) {
    const hashParams = new URLSearchParams(url.hash.substring(1));
    tokenParams.forEach(param => {
      if (hashParams.has(param)) {
        hashParams.delete(param);
        hasTokenParam = true;
      }
    });
    url.hash = hashParams.toString();
  }
  
  if (hasTokenParam) {
    // 使用replaceState避免在浏览器历史中留下token
    window.history.replaceState({}, '', url.toString());
    console.log('🧹 已从URL中清除token参数');
  }
}

/**
 * 初始化token处理系统
 * 在应用启动时调用
 */
export async function initializeTokenSystem(): Promise<void> {
  console.log('🚀 初始化AI剪辑API token系统...');
  
  // 1. 检查URL中是否有token
  const urlToken = getTokenFromUrl() || getTokenFromHash();
  if (urlToken) {
    console.log('🔑 发现URL中的token，保存到本地存储');
    setAIApiToken(urlToken);
    
    // 清除URL中的token（安全考虑）
    cleanTokenFromUrl();
  }
  
  // 2. 验证现有token
  const tokenInfo = await getSmartToken();
  if (tokenInfo) {
    console.log(`✅ Token系统初始化完成，使用${tokenInfo.source}来源的token`);
  } else {
    console.log('⚠️ Token系统初始化完成，但未找到有效token');
  }
}
