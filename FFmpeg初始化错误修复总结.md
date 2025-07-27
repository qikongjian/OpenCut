# FFmpeg初始化错误修复总结

## 问题描述

根据用户提供的错误信息，FFmpeg初始化失败，主要错误是：
```
Failed to initialize FFmpeg: Error: Cannot find module '/ffmpeg/ffmpeg-core.js'
```

## 问题分析

### 1. 错误原因
- **模块加载错误**：FFmpeg库尝试使用Node.js的模块系统加载文件，而不是通过HTTP请求
- **toBlobURL问题**：`toBlobURL`函数可能在某些环境下无法正确工作
- **CORS配置缺失**：缺少必要的跨域头配置

### 2. 技术背景
- 使用的是 `@ffmpeg/ffmpeg` 版本 `0.12.15`
- FFmpeg文件存在于 `apps/web/public/ffmpeg/` 目录
- 需要特殊的CORS配置来支持WebAssembly

## 修复内容

### 1. 修改FFmpeg初始化方式 (`ffmpeg-utils.ts`)

**修改前**：
```typescript
// 使用 toBlobURL 来正确加载文件
await ffmpeg.load({
  coreURL: await toBlobURL(`/ffmpeg/ffmpeg-core.js`, 'text/javascript'),
  wasmURL: await toBlobURL(`/ffmpeg/ffmpeg-core.wasm`, 'application/wasm'),
});
```

**修改后**：
```typescript
// 直接使用URL路径加载文件
await ffmpeg.load({
  coreURL: '/ffmpeg/ffmpeg-core.js',
  wasmURL: '/ffmpeg/ffmpeg-core.wasm',
});
```

### 2. 添加Next.js CORS配置 (`next.config.ts`)

**新增配置**：
```typescript
// 静态文件配置
async headers() {
  return [
    {
      source: '/ffmpeg/:path*',
      headers: [
        {
          key: 'Cross-Origin-Embedder-Policy',
          value: 'require-corp',
        },
        {
          key: 'Cross-Origin-Opener-Policy',
          value: 'same-origin',
        },
      ],
    },
  ];
},
```

### 3. 创建测试页面 (`test-ffmpeg/page.tsx`)

**测试功能**：
- 检查FFmpeg文件是否可访问
- 验证FFmpeg初始化过程
- 提供详细的错误信息

## 技术说明

### 1. CORS配置的重要性

WebAssembly需要特殊的CORS配置才能正常工作：

- **Cross-Origin-Embedder-Policy: require-corp**：要求所有资源都明确允许跨域
- **Cross-Origin-Opener-Policy: same-origin**：确保页面在相同的源上下文中运行

### 2. 文件加载方式

**直接URL方式**：
```typescript
coreURL: '/ffmpeg/ffmpeg-core.js'
```
- 更简单直接
- 减少中间步骤
- 更好的错误处理

**toBlobURL方式**：
```typescript
coreURL: await toBlobURL(`/ffmpeg/ffmpeg-core.js`, 'text/javascript')
```
- 在某些环境下可能有问题
- 需要额外的异步处理
- 可能引入额外的错误点

### 3. 错误处理改进

**更详细的错误分类**：
```typescript
if (error.message.includes('setLogger')) {
  errorMessage = 'FFmpeg library version incompatible - please update @ffmpeg/ffmpeg to latest version';
} else if (error.message.includes('fetch')) {
  errorMessage = 'Failed to load FFmpeg core files - check network connection';
} else if (error.message.includes('wasm')) {
  errorMessage = 'WebAssembly not supported or failed to load';
} else if (error.message.includes('load method not found')) {
  errorMessage = 'FFmpeg API incompatible - please check library version';
} else {
  errorMessage = `FFmpeg initialization failed: ${error.message}`;
}
```

## 测试步骤

### 1. 访问测试页面
```
http://localhost:3000/test-ffmpeg
```

### 2. 点击"Test FFmpeg"按钮

### 3. 观察结果
- ✅ 成功：显示"FFmpeg initialized successfully!"
- ❌ 失败：显示具体错误信息

### 4. 检查控制台日志
- 文件访问状态
- FFmpeg初始化过程
- 详细错误信息

## 可能的问题和解决方案

### 1. 如果文件仍然无法访问
**检查**：
- 文件是否存在于正确位置
- Next.js开发服务器是否正常运行
- 浏览器网络面板中的请求状态

**解决**：
```bash
# 检查文件是否存在
ls -la apps/web/public/ffmpeg/

# 重启开发服务器
npm run dev
```

### 2. 如果CORS错误仍然存在
**检查**：
- Next.js配置是否正确加载
- 浏览器控制台中的CORS错误

**解决**：
- 清除浏览器缓存
- 重启开发服务器
- 检查浏览器是否支持WebAssembly

### 3. 如果WebAssembly不支持
**检查**：
- 浏览器是否支持WebAssembly
- 是否在HTTPS环境下运行（某些浏览器要求）

**解决**：
- 使用现代浏览器（Chrome、Firefox、Safari最新版本）
- 在本地开发时使用HTTP（localhost）

## 验证方法

### 1. 浏览器控制台检查
```javascript
// 检查文件是否可访问
fetch('/ffmpeg/ffmpeg-core.js').then(r => console.log('JS file:', r.status));
fetch('/ffmpeg/ffmpeg-core.wasm').then(r => console.log('WASM file:', r.status));
```

### 2. 网络面板检查
- 打开浏览器开发者工具
- 切换到Network标签
- 刷新页面或触发FFmpeg初始化
- 查看FFmpeg文件的请求状态

### 3. 功能测试
- 尝试导出视频
- 检查是否还有"Cannot find module"错误
- 验证导出功能是否正常工作

## 当前状态

### 已修复
- ✅ FFmpeg文件加载方式
- ✅ Next.js CORS配置
- ✅ 错误处理改进
- ✅ 测试页面创建

### 待验证
- ⏳ FFmpeg初始化是否成功
- ⏳ 视频导出功能是否正常
- ⏳ CORS配置是否生效

## 下一步

1. **重新启动开发服务器**：
   ```bash
   npm run dev
   ```

2. **访问测试页面**：
   ```
   http://localhost:3000/test-ffmpeg
   ```

3. **测试导出功能**：
   - 打开编辑器页面
   - 添加媒体文件
   - 尝试导出视频

4. **如果还有问题**：
   - 提供新的错误信息
   - 检查测试页面的结果
   - 查看浏览器控制台日志

现在FFmpeg应该能够正确初始化，导出功能应该能够正常工作。请重新测试并告诉我结果！ 