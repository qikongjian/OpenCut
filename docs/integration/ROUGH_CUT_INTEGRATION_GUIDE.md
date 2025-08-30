# 🎬 粗剪视频接口集成指南

本文档详细说明了导出接口与粗剪视频接口的集成实现方案。

## 📋 概述

系统实现了导出成功后自动调用粗剪视频接口的完整流程：

**导出接口** → **视频生成** → **七牛云上传** → **粗剪视频接口调用**

## 🔧 核心组件

### 1. 项目 ID 获取 (`project-utils.ts`)

支持多种方式获取项目 ID，优先级如下：

```typescript
// 1. URL路径提取（最优先）
/ai-editor/[project_id] 或 /editor/[project_id]

// 2. AI编辑Store
aiEditingStore.aiEditingData?.project_id

// 3. 时间轴Store
timelineStore.projectId

// 4. URL查询参数
?project_id=xxx

// 5. 生成临时ID（备选）
temp-project-${timestamp}
```

### 2. 粗剪视频服务 (`rough-cut-service.ts`)

提供粗剪视频接口调用服务，支持：

- ✅ 智能重试机制（指数退避 + 随机抖动）
- ✅ 错误类型判断（可重试/不可重试）
- ✅ 超时控制和网络错误处理
- ✅ 详细的日志记录

### 3. 导出管理器集成 (`export-manager.ts`)

在所有导出方法中自动集成粗剪接口调用：

```typescript
// 导出成功后自动调用粗剪接口
if (result.success && result.url) {
  try {
    await this.callRoughCutAPI(result.url, result);
  } catch (error) {
    console.warn("⚠️ 粗剪视频接口调用失败，但不影响导出结果:", error);
    // 不抛出错误，避免影响导出流程
  }
}
```

## 🚀 接口规范

### 粗剪视频接口

**接口地址**: `https://77.smartvideo.py.qikongjian.com/movie/update_task_result`

**请求方法**: `POST`

**请求参数**:

```json
{
  "task_result": "{\"video\": \"https://cdn.qikongjian.com/1752776009.mp4\"}",
  "task_name": "generate_final_simple_video",
  "project_id": "a625cde0-7407-4bbc-91e4-d1ae705131c8"
}
```

**参数说明**:

- `task_result`: JSON 字符串，包含视频 URL
- `task_name`: 固定值 "generate_final_simple_video"
- `project_id`: 从 URL 或 Store 获取的项目 ID

## 📝 环境配置

### 必需环境变量

```bash
# 粗剪视频接口地址
ROUGH_CUT_API_URL=https://77.smartvideo.py.qikongjian.com/movie/update_task_result

# 可选：接口超时时间（毫秒，默认30000）
ROUGH_CUT_API_TIMEOUT=30000
```

### Next.js 配置

确保在 `env.ts` 中定义：

```typescript
export const env = {
  ROUGH_CUT_API_URL: process.env.ROUGH_CUT_API_URL,
  ROUGH_CUT_API_TIMEOUT: parseInt(process.env.ROUGH_CUT_API_TIMEOUT || "30000"),
  // ... 其他环境变量
};
```

## 🔄 集成流程

### 1. 用户触发导出

```typescript
// 在编辑器头部点击导出按钮
const result = await exportManager.smartExport({
  privacy: "balanced",
  quality: "standard",
  allowCloudProcessing: true,
});
```

### 2. 导出处理

```typescript
// 导出管理器处理
const result = await pythonExportClient.streamExport(ir, options);

// 添加云存储信息
if (result.cloudStorage) {
  result.cloudProvider = "qiniu";
}
```

### 3. 粗剪接口调用

```typescript
// 自动调用粗剪接口
if (result.success && result.url) {
  const projectId = getProjectIdFromMultipleSources();
  await roughCutService.updateTaskResult(projectId, result.url);
}
```

## 🛠️ 错误处理

### 重试策略

```typescript
// 指数退避 + 随机抖动
const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;

// 最大重试3次，最大延迟30秒
const maxRetries = 3;
const maxDelay = 30000;
```

### 可重试错误类型

- ✅ 网络超时 (timeout)
- ✅ 连接错误 (connection, ECONNRESET, ENOTFOUND)
- ✅ 5xx 服务器错误
- ✅ 429 Too Many Requests
- ❌ 4xx 客户端错误（除 429 外）

### 错误日志

```typescript
console.log("🎬 开始调用粗剪视频接口...");
console.log("🔍 粗剪接口调用参数:", { projectId, videoUrl });
console.log("📤 粗剪视频接口入参:", taskResult);
console.log("📥 粗剪视频API返回数据:", responseData);
```

## 🧪 测试验证

### 1. 快速测试

访问 `/test-rough-cut-integration` 页面进行快速配置检查。

### 2. 浏览器控制台测试

```javascript
// 完整测试
await window.testRoughCutIntegration();

// 快速检查
window.quickTestRoughCut();
```

### 3. 编辑器中测试

1. 打开编辑器页面 `/ai-editor/[project_id]`
2. 添加媒体内容
3. 点击导出按钮
4. 查看控制台日志确认粗剪接口调用

## 📊 监控指标

### 成功指标

- ✅ 导出成功率
- ✅ 粗剪接口调用成功率
- ✅ 项目 ID 获取成功率
- ✅ 平均响应时间

### 关键日志

```bash
# 成功日志
✅ 粗剪视频接口调用成功
📥 返回数据: {...}

# 失败日志
❌ 粗剪视频接口调用失败: [错误信息]
⚠️ 粗剪视频接口调用失败，但不影响导出结果

# 重试日志
🔄 尝试调用粗剪视频API (第2次)
⏳ 等待 2000ms 后重试...
```

## 🚨 故障排除

### 常见问题

1. **服务未配置**

   ```
   ⚠️ 粗剪视频服务未配置，请检查ROUGH_CUT_API_URL环境变量
   ```

   **解决**: 设置正确的环境变量

2. **项目 ID 获取失败**

   ```
   ⚠️ 无法获取项目ID，使用临时ID: temp-project-xxx
   ```

   **解决**: 在编辑器页面中测试，确保 URL 包含项目 ID

3. **网络连接问题**

   ```
   🌐 网络连接错误
   ⏰ 请求超时
   ```

   **解决**: 检查网络连接和防火墙设置

4. **接口返回错误**
   ```
   ❌ API响应错误: 400 Bad Request - Invalid parameters
   ```
   **解决**: 检查请求参数格式和接口文档

### 调试步骤

1. **检查环境配置**

   ```typescript
   console.log("ROUGH_CUT_API_URL:", process.env.ROUGH_CUT_API_URL);
   ```

2. **验证项目 ID**

   ```typescript
   const projectId = getProjectIdFromMultipleSources();
   console.log("Project ID:", projectId);
   ```

3. **测试网络连接**
   ```bash
   curl -X POST https://77.smartvideo.py.qikongjian.com/movie/update_task_result \
     -H "Content-Type: application/json" \
     -d '{"task_result": "{\"video\": \"test\"}", "task_name": "test", "project_id": "test"}'
   ```

## 📈 性能优化

### 1. 异步处理

粗剪接口调用不阻塞导出流程：

```typescript
// 不影响导出结果
try {
  await this.callRoughCutAPI(result.url, result);
} catch (error) {
  console.warn("⚠️ 粗剪视频接口调用失败，但不影响导出结果:", error);
}
```

### 2. 智能重试

- 指数退避避免服务器压力
- 随机抖动避免惊群效应
- 错误类型判断减少无效重试

### 3. 超时控制

```typescript
// 30秒超时，避免长时间阻塞
const controller = new AbortController();
setTimeout(() => controller.abort(), 30000);
```

## 🔐 安全考虑

### 1. 认证处理

使用智能 token 系统进行认证：

```typescript
const response = await authFetchWithSmartToken(apiUrl, {
  method: "POST",
  headers: { "User-Agent": "OpenCut/1.0" },
  body: JSON.stringify(taskResult),
});
```

### 2. 数据验证

- 项目 ID 格式验证
- 视频 URL 有效性检查
- 请求参数安全过滤

### 3. 错误信息脱敏

避免在日志中暴露敏感信息：

```typescript
console.log("📤 粗剪视频接口入参:", {
  task_name: taskResult.task_name,
  project_id: taskResult.project_id,
  // 不记录完整的task_result内容
});
```

## 🎯 最佳实践

1. **环境隔离**: 开发/测试/生产使用不同的接口地址
2. **监控告警**: 设置接口调用失败率告警
3. **日志收集**: 收集关键操作日志用于分析
4. **降级方案**: 接口调用失败不影响核心导出功能
5. **性能监控**: 监控接口响应时间和成功率

## 📚 相关文档

- [导出功能详细文档](../development/OpenCut导出功能详细文档.md)
- [API 集成完成总结](../deployment/API集成完成总结.md)
- [粗剪 API 集成文档](../development/ROUGH_CUT_API_INTEGRATION.md)

---

**更新时间**: 2024-01-20  
**版本**: v1.0.0  
**维护者**: OpenCut 团队
