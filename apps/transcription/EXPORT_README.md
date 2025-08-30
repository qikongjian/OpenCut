# OpenCut Python 视频导出服务

这是一个用Python重新实现的OpenCut视频导出服务，完全复用了Node.js版本的导出逻辑，提供高性能的视频处理能力。

## 🚀 特性

- **完全兼容**：与原有Node.js导出API完全兼容
- **高性能**：基于FFmpeg的原生性能
- **流式进度**：支持Server-Sent Events实时进度推送
- **异步处理**：基于asyncio的高并发处理
- **容器化**：支持Docker部署
- **字幕支持**：完整的ASS字幕生成和处理

## 📁 文件结构

```
apps/transcription/
├── video_export_api.py          # 核心导出逻辑
├── fastapi_export_server.py     # FastAPI Web服务
├── export_requirements.txt      # Python依赖
├── start_export_server.sh       # 启动脚本
├── Dockerfile.export           # Docker配置
└── EXPORT_README.md            # 本文档
```

## 🛠️ 安装和运行

### 方法1：直接运行（推荐开发环境）

#### 1. 检查系统要求
- Python 3.8+
- FFmpeg
- 至少2GB可用内存

#### 2. 运行启动脚本
```bash
cd apps/transcription
chmod +x start_export_server.sh
./start_export_server.sh
```

启动脚本会自动：
- 检查Python和FFmpeg
- 创建虚拟环境
- 安装依赖
- 启动服务器

#### 3. 手动安装（可选）
```bash
cd apps/transcription
python3 -m venv export_env
source export_env/bin/activate  # Linux/macOS
# 或 export_env\Scripts\activate  # Windows
pip install -r export_requirements.txt
python fastapi_export_server.py
```

### 方法2：Docker部署（推荐生产环境）

#### 1. 构建镜像
```bash
cd apps/transcription
docker build -f Dockerfile.export -t opencut-export:latest .
```

#### 2. 运行容器
```bash
docker run -d \
  --name opencut-export \
  -p 8000:8000 \
  -v /path/to/exports:/app/exports \
  opencut-export:latest
```

#### 3. 使用docker-compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  opencut-export:
    build:
      context: ./apps/transcription
      dockerfile: Dockerfile.export
    ports:
      - "8000:8000"
    volumes:
      - ./exports:/app/exports
    environment:
      - EXPORT_API_HOST=0.0.0.0
      - EXPORT_API_PORT=8000
    restart: unless-stopped
```

## 🌐 API接口

### 基础信息
- **服务地址**: `http://localhost:8000`
- **API文档**: `http://localhost:8000/docs` (Swagger UI)
- **健康检查**: `http://localhost:8000/health`

### 主要接口

#### 1. 流式导出（推荐）
```http
POST /api/export/stream
Content-Type: application/json

{
  "ir": {
    "width": 1920,
    "height": 1080,
    "fps": 30,
    "duration": 10000,
    "video": [...],
    "audio": [...],
    "texts": [...],
    "transitions": [...]
  },
  "options": {
    "quality": "standard",
    "codec": "libx264",
    "subtitleMode": "hard"
  }
}
```

**响应**: Server-Sent Events流，实时推送进度

#### 2. 同步导出
```http
POST /api/export/sync
```

等待导出完成并返回完整结果

#### 3. 查询任务状态
```http
GET /api/export/status/{task_id}
```

#### 4. 下载结果
```http
GET /api/export/download/{task_id}
```

#### 5. 验证请求
```http
POST /api/export/validate
```

## 📊 数据格式

### IR (Intermediate Representation)
```json
{
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "duration": 10000,
  "video": [
    {
      "id": "video1",
      "src": "/path/to/video.mp4",
      "in": 0,
      "out": 5000,
      "start": 0,
      "trackId": "track1"
    }
  ],
  "audio": [...],
  "texts": [
    {
      "id": "text1",
      "text": "字幕文本",
      "start": 1000,
      "end": 3000,
      "style": {
        "fontFamily": "Arial",
        "fontSize": 40,
        "color": "#FFFFFF",
        "align": "center"
      }
    }
  ],
  "transitions": [...]
}
```

### 导出选项
```json
{
  "quality": "standard",        // preview, standard, professional
  "codec": "libx264",          // libx264, libx265, libvpx-vp9, libaom-av1
  "subtitleMode": "hard",      // hard, soft, none
  "format": "mp4"              // mp4, webm, mov
}
```

## 🔄 与原有系统的集成

### 前端调用示例
```javascript
// 替换原有的 /api/export/stream 调用
const response = await fetch('http://localhost:8000/api/export/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    ir: timelineIR,
    options: exportOptions
  })
});

// 处理SSE流
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log('导出进度:', data);
      
      if (data.type === 'complete') {
        console.log('导出完成!');
      }
    }
  }
}
```

### 环境变量配置
```bash
# 在 .env.local 中添加
EXPORT_API_URL=http://localhost:8000
EXPORT_API_TIMEOUT=300000  # 5分钟超时
```

## 📈 性能优化

### 1. 内存管理
- 分段处理避免内存溢出
- 自动清理临时文件
- 限制并发导出任务

### 2. 编码优化
- 智能质量选择
- 硬件加速支持（如果可用）
- 预设优化参数

### 3. 并发控制
- 异步处理多个请求
- 任务队列管理
- 资源使用监控

## 🐛 故障排除

### 常见问题

#### 1. FFmpeg未找到
```bash
# 安装FFmpeg
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# CentOS/RHEL
sudo yum install ffmpeg
```

#### 2. 端口被占用
```bash
# 检查端口占用
lsof -i :8000

# 修改端口
export EXPORT_API_PORT=8001
```

#### 3. 内存不足
```bash
# 检查内存使用
free -h

# 减少并发任务数量
# 在代码中调整 max_concurrency 参数
```

#### 4. 权限问题
```bash
# 确保有写入权限
chmod 755 /path/to/exports
chown $USER:$USER /path/to/exports
```

### 日志查看
```bash
# 查看实时日志
tail -f /var/log/opencut-export.log

# 查看错误日志
grep ERROR /var/log/opencut-export.log
```

## 🔧 开发指南

### 添加新功能
1. 在 `video_export_api.py` 中添加核心逻辑
2. 在 `fastapi_export_server.py` 中添加API接口
3. 更新数据模型和验证规则
4. 添加测试用例

### 测试
```bash
# 运行测试
python -m pytest tests/

# 手动测试
python video_export_api.py
```

### 代码规范
- 使用类型注解
- 遵循PEP 8规范
- 添加文档字符串
- 使用异步编程模式

## 📝 更新日志

### v1.0.0 (2024-01-XX)
- 初始版本发布
- 完整的导出功能实现
- FastAPI Web服务
- Docker支持
- 流式进度推送

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

与OpenCut项目保持一致。
