# AI剪辑计划API健全Token处理系统

## 🎯 设计目标

基于video-flow项目的认证机制，为AI剪辑计划API设计一个健全的token处理系统，支持多种token获取方式，确保API调用的安全性和可靠性。

## 🏗️ 系统架构

### 核心组件

1. **智能Token获取器** (`getSmartToken`)
2. **多源Token处理器** (URL、localStorage、session等)
3. **自动认证请求封装** (`authFetchWithSmartToken`)
4. **Token生命周期管理** (存储、过期、清理)

### 支持的Token来源

| 优先级 | 来源 | 使用场景 | 示例 |
|--------|------|----------|------|
| 1 | URL参数 | 分享链接、外部集成 | `?token=abc123` |
| 2 | URL Hash | OAuth回调 | `#access_token=xyz789` |
| 3 | AI API专用存储 | 专门的AI API token | localStorage |
| 4 | Video-Flow认证 | 现有用户系统 | X-EASE-ADMIN-TOKEN |
| 5 | Session存储 | 临时会话 | sessionStorage |

## 🔧 核心功能

### 1. 智能Token获取

```typescript
// 自动按优先级获取最佳token
const tokenInfo = await getSmartToken();
if (tokenInfo) {
  console.log(`使用${tokenInfo.source}来源的token`);
}
```

### 2. URL Token处理

支持多种URL参数格式：
- `?token=xxx`
- `?access_token=xxx`
- `?auth_token=xxx`
- `?api_token=xxx`
- `?ai_token=xxx`

支持Hash格式（OAuth场景）：
- `#access_token=xxx`
- `#token=xxx`

### 3. 自动认证请求

```typescript
// 自动添加最佳token到请求头
const response = await authFetchWithSmartToken('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

### 4. Token安全处理

- **自动清理**: 从URL中移除token参数，避免泄露
- **过期检测**: 自动检测和清理过期token
- **错误处理**: 401错误时自动清理无效token

## 📋 使用方法

### 1. 基本集成

```typescript
import { 
  initializeTokenSystem, 
  authFetchWithSmartToken 
} from '@/lib/ai-editing-auth';

// 在应用启动时初始化
await initializeTokenSystem();

// 使用智能认证请求
const response = await authFetchWithSmartToken(apiUrl, {
  method: 'POST',
  body: JSON.stringify(requestData)
});
```

### 2. URL Token分享

用户可以通过URL分享带token的链接：

```
https://app.com/ai-editor/project123?token=user_api_token_here
```

系统会：
1. 自动提取token
2. 保存到本地存储
3. 从URL中清除token（安全考虑）
4. 后续API调用自动使用该token

### 3. 多环境支持

```typescript
// 开发环境
https://localhost:3000/ai-editor/project123?token=dev_token

// 生产环境  
https://app.com/ai-editor/project123?token=prod_token

// OAuth回调
https://app.com/callback#access_token=oauth_token&expires_in=3600
```

## 🔐 安全特性

### 1. Token隐私保护

- **URL清理**: 自动从浏览器地址栏移除token
- **历史记录保护**: 使用`replaceState`避免token进入浏览器历史
- **日志脱敏**: 日志中自动隐藏token内容

### 2. 过期处理

```typescript
// 自动检测token过期
if (Date.now() > expiryTime) {
  clearAIApiToken();
  console.log('Token已过期，已清除');
}
```

### 3. 错误恢复

```typescript
// 401错误时自动处理
if (response.status === 401) {
  clearAIApiToken();
  clearAuthData();
  // 可选：重定向到登录页
  window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
}
```

## 🚀 高级功能

### 1. Token来源适配

根据token来源使用不同的请求头格式：

```typescript
switch (tokenInfo.source) {
  case 'url':
  case 'localStorage':
    headers['X-EASE-ADMIN-TOKEN'] = token; // video-flow格式
    break;
  case 'better-auth':
    headers['Authorization'] = `Bearer ${token}`; // 标准格式
    break;
  case 'session':
    headers['X-AI-API-TOKEN'] = token; // 自定义格式
    break;
}
```

### 2. 智能重试机制

结合现有的重试机制，在token失效时自动重试：

```typescript
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    const response = await authFetchWithSmartToken(url, options);
    return response;
  } catch (error) {
    if (error.status === 401 && attempt < maxRetries) {
      // Token可能已更新，重试
      continue;
    }
    throw error;
  }
}
```

### 3. 开发调试支持

```typescript
// 开发环境下的详细日志
console.log('🔍 Token获取详情:', {
  urlToken: !!getTokenFromUrl(),
  localToken: !!getAIApiToken(),
  videoFlowToken: !!getToken(),
  selectedSource: tokenInfo?.source
});
```

## 📊 监控和分析

### 1. Token使用统计

```typescript
// 记录token使用情况
console.log('📊 Token使用统计:', {
  source: tokenInfo.source,
  hasExpiry: !!tokenInfo.expiresAt,
  isValid: await validateToken(tokenInfo.token)
});
```

### 2. 错误追踪

```typescript
// 详细的错误信息
console.error('❌ Token处理错误:', {
  error: error.message,
  tokenSource: tokenInfo?.source,
  apiUrl: url.replace(/token=[^&]+/g, 'token=***'),
  timestamp: new Date().toISOString()
});
```

## 🔄 迁移指南

### 从现有系统迁移

1. **保持兼容性**: 现有的video-flow token继续工作
2. **渐进升级**: 新功能使用新的token系统
3. **平滑过渡**: 用户无感知的升级体验

### 集成步骤

1. 导入token处理模块
2. 在应用启动时调用`initializeTokenSystem()`
3. 将现有的`fetch`调用替换为`authFetchWithSmartToken`
4. 测试各种token来源场景

## 🧪 测试场景

### 1. URL Token测试

```bash
# 测试不同的URL token格式
http://localhost:3000/ai-editor/project123?token=test_token
http://localhost:3000/ai-editor/project123?access_token=test_token
http://localhost:3000/ai-editor/project123#access_token=test_token
```

### 2. 认证流程测试

```typescript
// 测试完整的认证流程
1. 访问带token的URL
2. 验证token自动保存
3. 验证URL自动清理
4. 验证API调用使用正确token
5. 验证token过期处理
```

### 3. 错误处理测试

```typescript
// 测试各种错误场景
1. 无效token
2. 过期token
3. 网络错误
4. 服务器错误
```

## 📈 性能优化

### 1. Token缓存

- 避免重复的token验证请求
- 智能的token刷新策略
- 最小化localStorage访问

### 2. 请求优化

- 复用认证头信息
- 批量token验证
- 异步token初始化

## 🎯 最佳实践

1. **安全第一**: 始终从URL中清除token
2. **用户体验**: 无感知的token处理
3. **错误恢复**: 优雅的错误处理和重试
4. **调试友好**: 详细的日志和错误信息
5. **向后兼容**: 保持与现有系统的兼容性

这个token处理系统为AI剪辑计划API提供了企业级的安全性和可靠性，同时保持了良好的开发体验和用户体验。
