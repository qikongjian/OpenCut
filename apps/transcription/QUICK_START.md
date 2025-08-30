# 🚀 Python导出服务快速启动指南

## 📋 前置要求

1. **Python 3.8+** 已安装
2. **FFmpeg** 已安装
3. **Node.js** 已安装（用于前端）

## 🐍 启动Python导出服务

### 方法1：使用启动脚本（推荐）

```bash
cd apps/transcription
chmod +x start_export_server.sh
./start_export_server.sh
```

启动脚本会自动：
- ✅ 检查Python和FFmpeg
- ✅ 创建虚拟环境
- ✅ 安装依赖
- ✅ 启动服务器

### 方法2：手动启动

```bash
cd apps/transcription

# 创建虚拟环境
python3 -m venv export_env

# 激活虚拟环境
source export_env/bin/activate  # Linux/macOS
# 或 export_env\Scripts\activate  # Windows

# 安装依赖
pip install -r export_requirements.txt

# 启动服务
python fastapi_export_server.py
```

## 🌐 验证服务状态

服务启动后，访问以下地址验证：

- **服务地址**: http://localhost:8000
- **健康检查**: http://localhost:8000/health
- **API文档**: http://localhost:8000/docs

## ⚙️ 配置前端

### 1. 创建环境配置文件

在 `apps/web/` 目录下创建 `.env.local` 文件：

```bash
cd apps/web
cp .env.local.example .env.local  # 如果存在示例文件
```

### 2. 添加Python导出服务配置

在 `.env.local` 文件中添加：

```bash
# Python导出服务配置
NEXT_PUBLIC_ENABLE_PYTHON_EXPORT=true
NEXT_PUBLIC_PYTHON_EXPORT_URL=http://localhost:8000
NEXT_PUBLIC_PYTHON_EXPORT_TIMEOUT=300000
```

### 3. 重启前端服务

```bash
# 在 apps/web 目录下
npm run dev
# 或
yarn dev
```

## 🎯 测试导出功能

1. 打开浏览器访问：http://localhost:3000/editor/6fb14ce4-2d90-4c25-af07-f09c8b66e19c
2. 点击导出按钮
3. 查看控制台日志，应该看到：
   ```
   🐍 Python导出服务可用，使用Python导出
   🚀 调用Python导出服务: http://localhost:8000/api/export/stream
   ```

## 🔧 故障排除

### 1. Python服务无法启动

```bash
# 检查端口占用
lsof -i :8000

# 检查FFmpeg
ffmpeg -version

# 检查Python版本
python3 --version
```

### 2. 前端无法连接Python服务

```bash
# 检查CORS设置
# 检查防火墙设置
# 确认URL配置正确
```

### 3. 导出失败

```bash
# 查看Python服务日志
# 检查FFmpeg输出
# 验证IR数据格式
```

## 📊 性能对比

| 特性 | Python导出服务 | 前端导出 |
|------|----------------|----------|
| 性能 | 🚀 高性能 | ⚡ 中等 |
| 内存使用 | 🟢 低 | 🟡 中等 |
| 稳定性 | 🟢 高 | 🟡 中等 |
| 部署复杂度 | 🟡 中等 | 🟢 简单 |

## 🎉 成功标志

当看到以下日志时，说明配置成功：

```
🐍 Python导出服务可用，使用Python导出
📊 Python导出进度: { type: 'start', message: '开始导出...' }
📊 Python导出进度: { type: 'progress', stage: 'preparing', progress: 0.1 }
📊 Python导出进度: { type: 'complete', message: '导出完成' }
```

## 🔄 回退机制

如果Python导出服务不可用，系统会自动回退到前端导出：

```
🐍 Python导出服务不可用，回退到前端导出
🚀 回退到前端导出策略
```

## 📝 下一步

- 查看 [EXPORT_README.md](./EXPORT_README.md) 了解详细配置
- 查看 [API文档](http://localhost:8000/docs) 了解接口详情
- 根据需要调整质量和编码参数
