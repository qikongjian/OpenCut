# 七牛云集成部署指南

## 📋 概述

本指南将帮助您完成OpenCut视频导出系统与七牛云存储的集成配置。

## 🚀 功能特性

- ✅ Python后端高性能视频导出
- ✅ 七牛云自动上传
- ✅ CDN加速下载
- ✅ 前端智能下载处理
- ✅ 本地下载备选方案

## 📦 环境准备

### 1. Python依赖安装

```bash
cd apps/transcription
pip install -r requirements.txt

# 额外安装七牛云SDK
pip install qiniu requests aiohttp aiofiles
```

### 2. FFmpeg安装

确保系统已安装FFmpeg：

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# 验证安装
ffmpeg -version
```

## 🔧 七牛云配置

### 1. 获取七牛云配置信息

登录七牛云控制台获取以下信息：
- `ACCESS_KEY`: 访问密钥
- `SECRET_KEY`: 私有密钥  
- `BUCKET_NAME`: 存储空间名称
- `DOMAIN`: 绑定的域名

### 2. 配置环境变量

创建环境变量配置：

```bash
# 导出七牛云配置
export QINIU_ACCESS_KEY="Ef8cxF6Hg01m6wuLpMpUgICXcztrdsXKTJzjeoro"
export QINIU_SECRET_KEY="-VcHBrdszBch8hBKXw4itiF-dpCIcAc91LCb_pn3"
export QINIU_BUCKET_NAME="risingfalling"
export QINIU_DOMAIN="cdn.qikongjian.com"

# 导出API服务配置
export EXPORT_API_HOST="0.0.0.0"
export EXPORT_API_PORT="8000"
```

或者创建 `.env` 文件：

```bash
# 在 apps/transcription/ 目录下创建 .env 文件
cat > .env << EOF
QINIU_ACCESS_KEY=Ef8cxF6Hg01m6wuLpMpUgICXcztrdsXKTJzjeoro
QINIU_SECRET_KEY=-VcHBrdszBch8hBKXw4itiF-dpCIcAc91LCb_pn3
QINIU_BUCKET_NAME=risingfalling
QINIU_DOMAIN=cdn.qikongjian.com
EXPORT_API_HOST=0.0.0.0
EXPORT_API_PORT=8000
EOF
```

## 🖥️ 启动服务

### 1. 启动Python导出服务

```bash
cd apps/transcription

# 方式1: 直接运行
python fastapi_export_server.py

# 方式2: 使用uvicorn
uvicorn fastapi_export_server:app --host 0.0.0.0 --port 8000 --reload

# 方式3: 使用启动脚本
chmod +x start_export_server.sh
./start_export_server.sh
```

### 2. 验证服务状态

访问以下URL验证服务：

```bash
# 健康检查
curl http://localhost:8000/health

# API文档
open http://localhost:8000/docs
```

应该看到类似以下响应：

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00",
  "active_tasks": 0,
  "completed_exports": 0
}
```

### 3. 启动前端服务

```bash
cd apps/web

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 🧪 测试导出功能

### 1. 测试Python导出API

```bash
# 测试视频导出API
curl -X POST "http://localhost:8000/api/export/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "ir": {
      "width": 1920,
      "height": 1080,
      "fps": 30,
      "duration": 5000,
      "video": [],
      "audio": [],
      "texts": []
    },
    "options": {
      "quality": "standard",
      "codec": "libx264",
      "subtitleMode": "none"
    }
  }'
```

### 2. 测试七牛云上传

```bash
cd apps/transcription
python qiniu_uploader.py
```

### 3. 前端测试

1. 打开浏览器访问 `http://localhost:3000`
2. 创建一个简单的项目
3. 点击导出按钮
4. 观察控制台日志，确认：
   - Python导出服务连接成功
   - 视频处理进度
   - 七牛云上传状态
   - 下载链接生成

## 📊 监控和日志

### 1. Python服务日志

```bash
# 查看服务日志
tail -f /path/to/logs/export_server.log

# 或者查看uvicorn日志
uvicorn fastapi_export_server:app --log-level info
```

### 2. 前端开发者工具

打开浏览器开发者工具，查看：
- Network标签页：API请求状态
- Console标签页：前端日志输出

### 3. 关键日志信息

查找以下关键日志：

```
✅ 七牛云上传器配置完整且可用
🚀 开始上传导出视频到七牛云
✅ 文件上传七牛云成功
🎉 导出任务完成 - 七牛云模式
🌐 使用七牛云直链下载
```

## 🔧 故障排除

### 1. 七牛云配置问题

**问题**: `⚠️ 七牛云上传器配置不完整`

**解决方案**:
- 检查环境变量是否正确设置
- 验证ACCESS_KEY和SECRET_KEY是否有效
- 确认BUCKET_NAME和DOMAIN是否正确

### 2. Python服务连接问题

**问题**: `🐍 Python导出服务不可用`

**解决方案**:
- 检查Python服务是否在运行：`curl http://localhost:8000/health`
- 检查端口是否被占用：`lsof -i :8000`
- 检查防火墙设置

### 3. FFmpeg问题

**问题**: `FFmpeg failed with exit code`

**解决方案**:
- 验证FFmpeg安装：`ffmpeg -version`
- 检查输入文件格式支持
- 查看详细错误日志

### 4. 文件上传失败

**问题**: `⚠️ 文件上传七牛云失败`

**解决方案**:
- 检查网络连接
- 验证七牛云配置信息
- 检查存储空间权限
- 查看七牛云控制台日志

## 🚀 生产环境部署

### 1. 使用Docker部署

```dockerfile
# Dockerfile
FROM python:3.9-slim

RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "fastapi_export_server:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2. 使用Nginx反向代理

```nginx
# nginx.conf
upstream export_backend {
    server localhost:8000;
}

server {
    listen 80;
    server_name your-domain.com;

    location /api/export/ {
        proxy_pass http://export_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # 增加超时时间用于长时间导出
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }
}
```

### 3. 进程管理

使用PM2或systemd管理Python服务：

```bash
# 使用PM2
pm2 start fastapi_export_server.py --name export-server

# 使用systemd
sudo systemctl start export-server
sudo systemctl enable export-server
```

## 📞 技术支持

如有问题，请检查：

1. 七牛云控制台配置
2. Python服务日志
3. 前端开发者工具
4. 网络连接状态

技术支持：查看项目README或联系开发团队。
