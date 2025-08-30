#!/bin/bash

# OpenCut 视频导出服务启动脚本
# 文件路径: apps/transcription/start_export_server.sh

echo "🚀 启动OpenCut视频导出服务..."

# 检查Python版本
echo "📋 检查Python版本..."
python3 --version || {
    echo "❌ Python3 未安装，请先安装Python3"
    exit 1
}

# 检查FFmpeg
echo "📋 检查FFmpeg..."
ffmpeg -version > /dev/null 2>&1 || {
    echo "❌ FFmpeg 未安装，请先安装FFmpeg"
    exit 1
}

# 检查依赖包
echo "📋 检查Python依赖..."
python3 -c "import fastapi, uvicorn, qiniu, aiohttp, aiofiles" 2>/dev/null || {
    echo "⚠️ 缺少必要的Python依赖，正在安装..."
    pip3 install fastapi uvicorn qiniu aiohttp aiofiles
}

# 设置默认环境变量（如果未设置）
export QINIU_ACCESS_KEY="${QINIU_ACCESS_KEY:-Ef8cxF6Hg01m6wuLpMpUgICXcztrdsXKTJzjeoro}"
export QINIU_SECRET_KEY="${QINIU_SECRET_KEY:--VcHBrdszBch8hBKXw4itiF-dpCIcAc91LCb_pn3}"
export QINIU_BUCKET_NAME="${QINIU_BUCKET_NAME:-risingfalling}"
export QINIU_DOMAIN="${QINIU_DOMAIN:-cdn.qikongjian.com}"
export EXPORT_API_HOST="${EXPORT_API_HOST:-0.0.0.0}"
export EXPORT_API_PORT="${EXPORT_API_PORT:-8000}"

echo "🌐 七牛云配置:"
echo "   存储空间: $QINIU_BUCKET_NAME"
echo "   绑定域名: $QINIU_DOMAIN"
echo "   服务地址: $EXPORT_API_HOST:$EXPORT_API_PORT"

# 启动服务
echo "🐍 启动FastAPI导出服务..."
uvicorn fastapi_export_server:app \
    --host "$EXPORT_API_HOST" \
    --port "$EXPORT_API_PORT" \
    --reload \
    --log-level info \
    --access-log \
    || {
    echo "❌ 服务启动失败"
    exit 1
}