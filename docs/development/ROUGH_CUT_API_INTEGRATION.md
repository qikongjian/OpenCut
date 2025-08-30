# 粗剪视频API集成说明

## 📋 概述

本文档说明如何在OpenCut项目中集成粗剪视频API，实现导出成功后自动调用粗剪接口的功能。

## 🔄 工作流程

### 修改后的流程
```
用户点击导出 → 前端调用导出API → 后端处理导出 → 返回七牛云地址 → 前端调用粗剪接口
```

### 详细步骤
1. **导出阶段**：用户点击导出按钮，前端调用导出API
2. **后端处理**：后端执行视频导出，上传到七牛云
3. **返回数据**：后端返回导出结果，包含七牛云地址和粗剪接口调用数据
4. **前端调用**：前端在导出成功后，使用七牛云地址调用粗剪接口
5. **状态反馈**：前端显示粗剪接口调用状态和结果

## 🏗️ 架构设计

### 核心组件
- **`rough-cut-client.ts`**：前端粗剪接口调用客户端
- **`rough-cut-service.ts`**：后端粗剪接口服务（可选）
- **`export-callback-manager.ts`**：导出回调管理器
- **`rough-cut-caller.tsx`**：粗剪接口调用UI组件

### 配置管理
- **环境变量**：通过环境变量配置API地址和超时时间
- **配置文件**：`config/rough-cut.ts` 提供配置管理和验证

## ⚙️ 配置说明

### 环境变量
```bash
# 粗剪视频API配置
ROUGH_CUT_API_URL=https://77.smartvideo.py.qikongjian.com/movie/update_task_result
ROUGH_CUT_API_TIMEOUT=30000

# 前端可访问的API地址
NEXT_PUBLIC_AI_EDITING_PLAN_API_URL=https://77.smartvideo.py.qikongjian.com
```

### 配置文件
```typescript
// config/rough-cut.ts
export const ROUGH_CUT_CONFIG = {
  api: {
    url: env.ROUGH_CUT_API_URL || 'https://77.smartvideo.py.qikongjian.com/movie/update_task_result',
    timeout: env.ROUGH_CUT_API_TIMEOUT || 30000,
    retryCount: 3,
    retryDelay: 1000,
  },
  // ... 其他配置
};
```

## 🚀 使用方法

### 1. 基本调用
```typescript
import { callRoughCutAPI } from '@/lib/rough-cut-client';

// 系统会自动处理token认证
const result = await callRoughCutAPI({
  projectId: 'your-project-id',
  videoUrl: 'https://cdn.qikongjian.com/your-video.mp4',
  taskName: 'generate_final_simple_video',
  onProgress: (progress) => {
    console.log(progress.message);
  }
});

if (result.success) {
  console.log('粗剪接口调用成功');
} else {
  console.error('调用失败:', result.error);
}
```

**注意**: 系统会自动初始化token系统并获取最佳token进行认证。支持多种token来源：
- URL参数: `?token=xxx`
- localStorage: AI API专用token
- Video-Flow认证: 现有用户系统token

### 2. 使用UI组件
```tsx
import { RoughCutCaller } from '@/components/rough-cut-caller';

<RoughCutCaller
  projectId="your-project-id"
  videoUrl="https://cdn.qikongjian.com/your-video.mp4"
  taskName="generate_final_simple_video"
  onSuccess={(result) => console.log('成功:', result)}
  onError={(error) => console.error('失败:', error)}
/>
```

### 3. 在导出流程中集成
```typescript
// 导出成功后调用粗剪接口
const exportResult = await exportManager.smartExport(options);

if (exportResult.success && exportResult.qiniuUrl) {
  // 调用粗剪接口
  const roughCutResult = await callRoughCutAPI({
    projectId: currentProjectId,
    videoUrl: exportResult.qiniuUrl,
    onProgress: (progress) => {
      setExportMessage(progress.message);
    }
  });
}
```

## 📡 API接口规范

### 请求格式
```json
{
  "task_result": "{\"video\": \"https://cdn.qikongjian.com/video.mp4\"}",
  "task_name": "generate_final_simple_video",
  "project_id": "a625cde0-7407-4bbc-91e4-d1ae705131c8"
}
```

**注意**: `task_result` 字段是一个JSON字符串，包含视频URL信息。格式为 `"{\"video\": \"视频URL\"}"`

### 响应格式
```json
{
  "success": true,
  "message": "任务更新成功",
  "data": {
    "task_id": "task_123",
    "status": "completed"
  }
}
```

## 🔧 错误处理

### 重试机制
- 默认重试3次
- 可配置重试间隔
- 支持指数退避策略

### 错误类型
- **网络错误**：请求超时、连接失败
- **API错误**：状态码错误、响应格式错误
- **业务错误**：参数错误、权限错误

### 错误处理策略
```typescript
try {
  const result = await callRoughCutAPI(options);
  if (result.success) {
    // 处理成功
  } else {
    // 处理失败
    console.error('调用失败:', result.error);
  }
} catch (error) {
  // 处理异常
  console.error('调用异常:', error);
}
```

## 📊 监控和日志

### 进度监控
- 实时显示调用进度
- 支持多阶段状态显示
- 可配置进度回调

### 日志记录
- 详细的API调用日志
- 错误信息和堆栈跟踪
- 性能指标统计

### 健康检查
```typescript
import { roughCutClient } from '@/lib/rough-cut-client';

const health = await roughCutClient.checkServiceHealth();
console.log('服务状态:', health);
```

## 🧪 测试和调试

### 开发环境
- 启用详细日志
- 显示调试信息
- 支持模拟响应

### 测试用例
```typescript
// 测试基本调用
test('should call rough cut API successfully', async () => {
  const result = await callRoughCutAPI({
    projectId: 'test-project',
    videoUrl: 'https://example.com/test.mp4'
  });
  
  expect(result.success).toBe(true);
});

// 测试错误处理
test('should handle API errors gracefully', async () => {
  const result = await callRoughCutAPI({
    projectId: 'invalid-project',
    videoUrl: 'invalid-url'
  });
  
  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
});
```

## 🔒 安全考虑

### Token认证
- **智能Token获取**: 支持多种token来源（URL、localStorage、session等）
- **自动认证**: 使用 `authFetchWithSmartToken` 自动添加认证头
- **Token验证**: 自动检测token有效性，401错误时清理过期token
- **安全清理**: 自动从URL中移除token参数，避免泄露

### 数据验证
- 验证项目ID格式
- 验证视频URL有效性
- 防止恶意请求

### 权限控制
- 检查用户权限
- 验证项目所有权
- 限制API调用频率

### 错误信息
- 不暴露敏感信息
- 提供有意义的错误消息
- 记录安全相关事件

## 📈 性能优化

### 异步处理
- 非阻塞式API调用
- 支持并发调用
- 异步状态更新

### 缓存策略
- 缓存API响应
- 避免重复调用
- 智能重试策略

### 资源管理
- 及时清理资源
- 内存使用优化
- 网络连接复用

## 🚨 故障排除

### 常见问题
1. **API调用失败**
   - 检查网络连接
   - 验证API地址
   - 检查认证信息

2. **超时错误**
   - 增加超时时间
   - 检查网络延迟
   - 优化请求大小

3. **重试失败**
   - 检查重试配置
   - 分析错误原因
   - 调整重试策略

### 调试技巧
- 启用详细日志
- 使用浏览器开发者工具
- 检查网络请求
- 验证响应数据

## 📚 相关文档

- [导出功能详细文档](./OpenCut导出功能详细文档.md)
- [API集成完成总结](../deployment/docs/API集成完成总结.md)
- [环境配置说明](./ENVIRONMENT_CONFIGURATION.md)

## 🤝 贡献指南

### 代码规范
- 遵循TypeScript最佳实践
- 使用ESLint和Prettier
- 编写单元测试
- 添加JSDoc注释

### 提交规范
- 使用语义化提交信息
- 包含测试用例
- 更新相关文档
- 遵循Git工作流

---

**注意**：本文档会随着功能更新而持续维护，如有疑问请及时反馈。
