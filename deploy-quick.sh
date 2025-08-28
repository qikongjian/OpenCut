#!/bin/bash

# OpenCut快速部署脚本
# 优化版本，支持压缩包检测和选择

# 配置
PROJECT_PATH="/Users/Shared/Relocated Items/Security/myDesk/my-pro/OpenCut"
SERVER="mf@39.105.24.90"
SERVER_PATH="/home/mf"
REMOTE_PROJECT_PATH="/home/mf/OpenCut"
PORT="3000"
ZIP_NAME="OpenCut.zip"

# 颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m'

# 错误处理函数
error_exit() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# 成功信息函数
success_msg() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 信息函数
info_msg() {
    echo -e "${BLUE}$1${NC}"
}

# 警告函数
warn_msg() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 检查依赖
check_dependencies() {
    info_msg "🔍 检查依赖..."

    # 检查本地依赖
    if ! command -v zip &> /dev/null; then
        error_exit "zip 命令未找到，请安装"
    fi

    if ! command -v ssh &> /dev/null; then
        error_exit "ssh 命令未找到"
    fi

    if ! command -v scp &> /dev/null; then
        error_exit "scp 命令未找到"
    fi

    # 测试服务器连接
    if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "$SERVER" exit 2>/dev/null; then
        error_exit "无法连接到服务器 $SERVER，请检查SSH配置"
    fi

    success_msg "依赖检查通过"
}

# 检查项目目录
check_project_dir() {
    info_msg "📁 检查项目目录..."

    if [ ! -d "$PROJECT_PATH" ]; then
        error_exit "项目目录不存在: $PROJECT_PATH"
    fi

    cd "$PROJECT_PATH" || error_exit "无法进入项目目录"

    # 检查关键文件
    if [ ! -f "package.json" ]; then
        error_exit "项目目录中未找到 package.json"
    fi

    success_msg "项目目录检查通过"
}

# 检查现有压缩包并让用户选择
check_existing_zip() {
    local zip_path="$PROJECT_PATH/$ZIP_NAME"

    if [ -f "$zip_path" ]; then
        local zip_size=$(du -h "$zip_path" | cut -f1)
        warn_msg "发现现有压缩包 $ZIP_NAME ($zip_size)"

        read -p "是否重新打包？(y/N): " remake

        if [[ $remake =~ ^[Yy]$ ]]; then
            info_msg "🔄 重新创建压缩包..."
            rm -f "$zip_path"
            return 1  # 需要重新打包
        else
            info_msg "✅ 使用现有压缩包"
            return 0  # 使用现有压缩包
        fi
    fi

    return 1  # 没有现有压缩包，需要创建
}

# 创建压缩包
create_zip() {
    info_msg "📦 创建项目压缩包..."

    local zip_path="$PROJECT_PATH/$ZIP_NAME"

    # 完整打包整个项目（包含 node_modules）
    local parent_dir=$(dirname "$PROJECT_PATH")
    local project_name=$(basename "$PROJECT_PATH")

    cd "$parent_dir"

    # 使用pv显示进度，如果没有pv则显示旋转指示器
    if command -v pv &> /dev/null; then
        echo -n "正在压缩完整项目（含依赖）... "
        zip -r "$zip_path" "$project_name" \
            -x "$project_name/.git/*" \
               "$project_name/.DS_Store" \
               "$project_name/*.tmp" \
               "$project_name/out.log" \
               "$project_name/logs/*" \
               "$project_name/.next/*" \
               "$project_name/coverage/*" \
               "$project_name/*.zip" \
               "$project_name/__pycache__/*" \
               "$project_name/*.pyc" \
               "$project_name/.pytest_cache/*" 2>/dev/null | pv -l -s $(find "$project_name" -type f | wc -l) > /dev/null
    else
        # 简单的进度指示
        echo -n "正在压缩完整项目（含依赖）"
        (
            zip -r "$zip_path" "$project_name" \
                -x "$project_name/.git/*" \
                   "$project_name/.DS_Store" \
                   "$project_name/*.tmp" \
                   "$project_name/out.log" \
                   "$project_name/logs/*" \
                   "$project_name/.next/*" \
                   "$project_name/coverage/*" \
                   "$project_name/*.zip" \
                   "$project_name/__pycache__/*" \
                   "$project_name/*.pyc" \
                   "$project_name/.pytest_cache/*" 2>/dev/null
        ) &
        local zip_pid=$!
        while kill -0 $zip_pid 2>/dev/null; do
            echo -n "."
            sleep 1
        done
        wait $zip_pid
        local zip_result=$?
        echo
        if [ $zip_result -ne 0 ]; then
            error_exit "压缩包创建失败"
        fi
    fi

    # 显示压缩包信息
    local zip_size=$(du -h "$zip_path" | cut -f1)
    success_msg "压缩包创建成功 (大小: $zip_size)"
}

# 上传到服务器
upload_to_server() {
    info_msg "📤 上传到服务器..."

    local zip_path="$PROJECT_PATH/$ZIP_NAME"
    local remote_zip="$SERVER_PATH/$ZIP_NAME"

    # 先删除服务器上的旧压缩包
    info_msg "🗑️  清理服务器上的旧压缩包..."
    ssh "$SERVER" "rm -f '$remote_zip'" || true

    # 使用rsync代替scp，支持断点续传和进度显示
    if command -v rsync &> /dev/null; then
        if ! rsync -avz --progress "$zip_path" "$SERVER:$remote_zip"; then
            error_exit "上传失败 (使用 rsync)"
        fi
    else
        if ! scp "$zip_path" "$SERVER:$remote_zip"; then
            error_exit "上传失败 (使用 scp)"
        fi
    fi

    # 验证上传
    if ! ssh "$SERVER" "[ -f '$remote_zip' ]"; then
        error_exit "上传验证失败，服务器上未找到文件"
    fi

    success_msg "上传成功"
}

# 在服务器上部署
deploy_on_server() {
    info_msg "🔧 在服务器上部署..."

    ssh "$SERVER" bash << EOF
        set -e  # 遇到错误立即退出

        echo "=== 开始服务器部署 ==="

        # 先停止现有服务
        echo "🔴 停止现有服务..."

        # 方法1: 通过端口查找并杀死进程
        PORT_PIDS=\$(sudo lsof -ti:$PORT 2>/dev/null || true)
        if [ ! -z "\$PORT_PIDS" ]; then
            echo "发现占用端口 $PORT 的进程: \$PORT_PIDS"
            echo \$PORT_PIDS | xargs -r sudo kill -TERM
            sleep 3
            # 如果还存在，强制杀死
            PORT_PIDS=\$(sudo lsof -ti:$PORT 2>/dev/null || true)
            if [ ! -z "\$PORT_PIDS" ]; then
                echo "强制杀死进程: \$PORT_PIDS"
                echo \$PORT_PIDS | xargs -r sudo kill -KILL
                sleep 2
            fi
        fi

        # 方法2: 查找相关的bun进程
        BUN_PIDS=\$(pgrep -f "bun run dev" 2>/dev/null || true)
        if [ ! -z "\$BUN_PIDS" ]; then
            echo "发现 bun 进程: \$BUN_PIDS"
            echo \$BUN_PIDS | xargs -r kill -TERM
            sleep 2
            # 检查是否还存在
            BUN_PIDS=\$(pgrep -f "bun run dev" 2>/dev/null || true)
            if [ ! -z "\$BUN_PIDS" ]; then
                echo "强制杀死 bun 进程: \$BUN_PIDS"
                echo \$BUN_PIDS | xargs -r kill -KILL
            fi
        fi

        echo "✅ 服务停止完成"

        # 删除旧的项目目录
        if [ -d "$REMOTE_PROJECT_PATH" ]; then
            echo "🗑️  删除旧的项目目录..."
            rm -rf "$REMOTE_PROJECT_PATH"
            echo "✅ 旧目录删除完成"
        fi

        # 解压新版本
        echo "📦 解压新版本..."
        cd "$SERVER_PATH"

        # 检查压缩包结构并解压（不显示详细输出）
        if unzip -l "$ZIP_NAME" | head -5 | grep -q "OpenCut/" >/dev/null 2>&1; then
            # 正常解压，显示进度
            echo -n "解压中"
            (unzip -o "$ZIP_NAME" >/dev/null 2>&1) &
            unzip_pid=\$!
            while kill -0 \$unzip_pid 2>/dev/null; do
                echo -n "."
                sleep 0.5
            done
            wait \$unzip_pid
            unzip_result=\$?
            echo
            if [ \$unzip_result -ne 0 ]; then
                echo "❌ 解压失败"
                exit 1
            fi
        else
            # 创建 OpenCut 目录并解压到其中
            echo -n "创建目录并解压"
            mkdir -p "$REMOTE_PROJECT_PATH"
            (unzip -o "$ZIP_NAME" -d "$REMOTE_PROJECT_PATH" >/dev/null 2>&1) &
            unzip_pid=\$!
            while kill -0 \$unzip_pid 2>/dev/null; do
                echo -n "."
                sleep 0.5
            done
            wait \$unzip_pid
            unzip_result=\$?
            echo
            if [ \$unzip_result -ne 0 ]; then
                echo "❌ 解压失败"
                exit 1
            fi
        fi

        # 验证解压结果（静默检查）
        if [ ! -d "$REMOTE_PROJECT_PATH" ]; then
            echo "❌ 解压后未找到项目目录"
            exit 1
        fi

        if [ ! -f "$REMOTE_PROJECT_PATH/package.json" ]; then
            echo "❌ 项目目录中未找到 package.json"
            exit 1
        fi

        echo "✅ 解压成功"

        # 跳过依赖安装（已包含在压缩包中）
        cd "$REMOTE_PROJECT_PATH"
        echo "✅ 使用打包的完整项目（包含依赖）"

        # 启动服务
        echo "🚀 启动服务..."

        # 直接使用 bun run dev（node_modules 已包含）
        nohup setsid bun run dev > out.log 2>&1 < /dev/null &
        NEW_PID=\$!

        echo "等待服务启动..."
        sleep 8

        # 验证启动状态
        echo "🔍 检查服务状态..."

        # 检查进程
        if ps -p \$NEW_PID > /dev/null 2>&1; then
            echo "✅ 进程运行中 (PID: \$NEW_PID)"
        else
            echo "❌ 进程未运行，检查日志:"
            tail -n 20 out.log
            exit 1
        fi

        # 检查端口
        PORT_CHECK=\$(sudo netstat -tlnp 2>/dev/null | grep ":$PORT " || true)
        if [ ! -z "\$PORT_CHECK" ]; then
            echo "✅ 端口 $PORT 正在监听"
            echo "\$PORT_CHECK"
        else
            echo "⚠️  端口 $PORT 未监听，可能还在启动中"
        fi

        # 清理压缩包
        rm -f "$SERVER_PATH/$ZIP_NAME"

        echo "=== 部署完成 ==="
EOF

    if [ $? -ne 0 ]; then
        error_exit "服务器部署失败"
    fi

    success_msg "服务器部署完成"
}

# 主函数
main() {
    info_msg "🚀 OpenCut 快速部署开始..."

    # 检查依赖和项目
    check_dependencies
    check_project_dir

    # 检查是否需要重新打包
    if check_existing_zip; then
        info_msg "⏭️  跳过打包步骤"
    else
        create_zip
    fi

    # 上传和部署
    upload_to_server
    deploy_on_server

    success_msg "🎉 部署完成！"
    info_msg "🌐 访问地址: http://39.105.24.90:$PORT"

    # 询问是否查看日志
    echo
    read -p "是否查看服务日志？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info_msg "📋 查看服务日志..."
        ssh "$SERVER" "tail -f -n 50 $REMOTE_PROJECT_PATH/out.log"
    fi
}

# 运行主函数
main "$@"