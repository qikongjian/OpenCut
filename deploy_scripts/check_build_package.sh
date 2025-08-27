#!/bin/bash

# 检查构建包结构的脚本
echo "检查构建包结构..."

if [ ! -d "dist" ]; then
    echo "错误: dist 目录不存在，请先运行 compile.sh"
    exit 1
fi

echo "📁 dist 目录结构:"
tree dist -I 'node_modules' 2>/dev/null || find dist -type f | head -20

echo ""
echo "🔍 关键文件检查:"

# 检查根 package.json
if [ -f "dist/package.json" ]; then
    echo "✅ 根 package.json 存在"
else
    echo "❌ 根 package.json 缺失"
fi

# 检查 web 应用 package.json
if [ -f "dist/package.json" ]; then
    echo "✅ web 应用 package.json 存在"
else
    echo "❌ web 应用 package.json 缺失"
fi

# 检查 workspace 依赖
if [ -d "dist/packages/auth" ]; then
    echo "✅ @opencut/auth 包存在"
else
    echo "❌ @opencut/auth 包缺失"
fi

if [ -d "dist/packages/db" ]; then
    echo "✅ @opencut/db 包存在"
else
    echo "❌ @opencut/db 包缺失"
fi

# 检查构建产物
if [ -d "dist/.next" ]; then
    echo "✅ Next.js 构建产物存在"
else
    echo "❌ Next.js 构建产物缺失"
fi

if [ -d "dist/public" ]; then
    echo "✅ 静态资源目录存在"
else
    echo "❌ 静态资源目录缺失"
fi

# 检查 bun.lock
if [ -f "dist/bun.lock" ]; then
    echo "✅ bun.lock 文件存在"
else
    echo "❌ bun.lock 文件缺失"
fi

echo ""
echo "📊 包大小信息:"
du -sh dist/* 2>/dev/null | sort -hr

echo ""
echo "检查完成！"
