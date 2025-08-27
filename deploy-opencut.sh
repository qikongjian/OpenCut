#!/bin/bash

# OpenCut项目部署脚本
# 作者: OpenCut Team
# 日期: $(date +%Y-%m-%d)
# 描述: 自动化部署OpenCut项目到服务器

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="OpenCut"
LOCAL_PROJECT_PATH="/Users/lishuqing/PycharmProjects/OpenCut"
ZIP_NAME="${PROJECT_NAME}.zip"
SERVER_USER="mf"
SERVER_IP="39.105.24.90"
SERVER_PATH="/home/mf"
REMOTE_ZIP_PATH="${SERVER_PATH}/${ZIP_NAME}"
REMOTE_PROJECT_PATH="${SERVER_PATH}/${PROJECT_NAME}"
PORT="3000"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查本地项目是否存在
check_local_project() {
    log_info "检查本地项目..."
    if [ ! -d "$LOCAL_PROJECT_PATH" ]; then
        log_error "本地项目路径不存在: $LOCAL_PROJECT_PATH"
        exit 1
    fi
    log_success "本地项目检查通过"
}

# 创建项目压缩包
create_zip() {
    log_info "开始创建项目压缩包..."
    
    # 切换到项目目录
    cd "$LOCAL_PROJECT_PATH" || {
        log_error "无法切换到项目目录"
        exit 1
    }
    
    # 删除旧的压缩包
    if [ -f "../${ZIP_NAME}" ]; then
        log_info "删除旧的压缩包..."
        rm -f "../${ZIP_NAME}"
    fi
    
    # 创建新的压缩包（保持项目完整性）
    log_info "创建新的压缩包..."
    zip -r "../${ZIP_NAME}" . \
        -x ".git/*" \
        -x ".DS_Store" \
        -x "*.tmp"
    
    if [ $? -eq 0 ]; then
        log_success "压缩包创建成功: ../${ZIP_NAME}"
        ZIP_FULL_PATH="$(cd .. && pwd)/${ZIP_NAME}"
    else
        log_error "压缩包创建失败"
        exit 1
    fi
}

# 连接服务器并执行命令
execute_remote_commands() {
    log_info "连接服务器并执行部署命令..."
    
    ssh "$SERVER_USER@$SERVER_IP" << 'EOF'
        # 设置日志函数
        log_info() {
            echo -e "\033[0;34m[INFO]\033[0m $1"
        }
        
        log_success() {
            echo -e "\033[0;32m[SUCCESS]\033[0m $1"
        }
        
        log_warning() {
            echo -e "\033[1;33m[WARNING]\033[0m $1"
        }
        
        log_error() {
            echo -e "\033[0;31m[ERROR]\033[0m $1"
        }
        
        echo "=== 开始服务器端部署 ==="
        
        # 1. 删除旧的压缩包
        log_info "删除旧的压缩包..."
        if [ -f "/home/mf/OpenCut.zip" ]; then
            rm -f "/home/mf/OpenCut.zip"
            log_success "旧压缩包已删除"
        else
            log_warning "未找到旧的压缩包"
        fi
        
        # 2. 查找并杀死占用3000端口的进程
        log_info "查找占用3000端口的进程..."
        PORT_PID=$(sudo netstat -tlnp 2>/dev/null | grep ":$PORT " | awk '{print $7}' | cut -d'/' -f1)
        
        if [ ! -z "$PORT_PID" ]; then
            log_info "发现进程 PID: $PORT_PID 占用端口 $PORT"
            sudo kill -9 "$PORT_PID" 2>/dev/null
            if [ $? -eq 0 ]; then
                log_success "进程 $PORT_PID 已终止"
            else
                log_warning "无法终止进程 $PORT_PID"
            fi
        else
            log_info "端口 $PORT 当前未被占用"
        fi
        
        # 3. 检查并删除旧的OpenCut文件夹
        log_info "检查旧的OpenCut文件夹..."
        if [ -d "/home/mf/OpenCut" ]; then
            log_info "发现旧的OpenCut文件夹，正在删除..."
            rm -rf "/home/mf/OpenCut"
            if [ $? -eq 0 ]; then
                log_success "旧项目文件夹已删除"
            else
                log_error "删除旧项目文件夹失败"
                exit 1
            fi
        else
            log_info "未找到旧的项目文件夹"
        fi
        
        # 4. 验证旧文件夹已完全删除
        log_info "验证旧文件夹删除状态..."
        if [ -d "/home/mf/OpenCut" ]; then
            log_error "旧项目文件夹仍然存在，无法继续部署"
            exit 1
        else
            log_success "旧项目文件夹已完全删除"
        fi
        
        # 4. 等待端口完全释放
        log_info "等待端口释放..."
        sleep 3
        
        # 5. 检查端口状态
        PORT_STATUS=$(sudo netstat -tlnp 2>/dev/null | grep ":$PORT " | wc -l)
        if [ "$PORT_STATUS" -eq 0 ]; then
            log_success "端口 $PORT 已完全释放"
        else
            log_warning "端口 $PORT 可能仍被占用"
        fi
        
        echo "=== 服务器端准备完成 ==="
EOF
}

# 上传压缩包到服务器
upload_zip() {
    log_info "上传压缩包到服务器..."
    
    if [ ! -f "$ZIP_FULL_PATH" ]; then
        log_error "压缩包不存在: $ZIP_FULL_PATH"
        exit 1
    fi
    
    scp "$ZIP_FULL_PATH" "$SERVER_USER@$SERVER_IP:$SERVER_PATH/"
    
    if [ $? -eq 0 ]; then
        log_success "压缩包上传成功"
    else
        log_error "压缩包上传失败"
        exit 1
    fi
}

# 在服务器上解压并启动项目
deploy_and_start() {
    log_info "在服务器上解压并启动项目..."
    
    ssh "$SERVER_USER@$SERVER_IP" << 'EOF'
        # 设置日志函数
        log_info() {
            echo -e "\033[0;34m[INFO]\033[0m $1"
        }
        
        log_success() {
            echo -e "\033[0;32m[SUCCESS]\033[0m $1"
        }
        
        log_warning() {
            echo -e "\033[1;33m[WARNING]\033[0m $1"
        }
        
        log_error() {
            echo -e "\033[0;31m[ERROR]\033[0m $1"
        }
        
        echo "=== 开始部署和启动 ==="
        
        # 1. 解压项目
        log_info "解压项目文件..."
        cd /home/mf
        unzip -q OpenCut.zip
        
        if [ $? -eq 0 ]; then
            log_success "项目解压成功"
        else
            log_error "项目解压失败"
            exit 1
        fi
        
        # 2. 进入项目目录
        cd OpenCut || {
            log_error "无法进入项目目录"
            exit 1
        }
        
        # 3. 安装依赖（如果需要）
        log_info "检查并安装依赖..."
        if [ ! -d "node_modules" ]; then
            log_info "安装项目依赖..."
            bun install
            if [ $? -eq 0 ]; then
                log_success "依赖安装成功"
            else
                log_warning "依赖安装可能失败，继续尝试启动"
            fi
        else
            log_info "依赖已存在，跳过安装"
        fi
        
        # 4. 后台启动项目
        log_info "后台启动项目..."
        nohup bun run dev > out.log 2>&1 &
        
        if [ $? -eq 0 ]; then
            log_success "项目启动命令已执行"
        else
            log_error "项目启动失败"
            exit 1
        fi
        
        # 5. 等待启动
        log_info "等待项目启动..."
        sleep 5
        
        # 6. 检查端口状态
        log_info "检查端口状态..."
        PORT_STATUS=$(sudo netstat -tlnp 2>/dev/null | grep ":$PORT " | wc -l)
        
        if [ "$PORT_STATUS" -gt 0 ]; then
            log_success "端口 $PORT 已启动"
            sudo netstat -tlnp | grep ":$PORT "
        else
            log_warning "端口 $PORT 可能未启动"
        fi
        
        echo "=== 部署和启动完成 ==="
EOF
}

# 查看项目日志
view_logs() {
    log_info "查看项目日志..."
    
    ssh "$SERVER_USER@$SERVER_IP" << 'EOF'
        echo "=== 项目日志 (最后200行) ==="
        if [ -f "/home/mf/OpenCut/out.log" ]; then
            tail -f -n 200 /home/mf/OpenCut/out.log
        else
            echo "日志文件不存在，等待创建..."
            sleep 2
            if [ -f "/home/mf/OpenCut/out.log" ]; then
                tail -f -n 200 /home/mf/OpenCut/out.log
            else
                echo "仍未找到日志文件"
            fi
        fi
EOF
}

# 检查部署状态
check_deployment_status() {
    log_info "检查部署状态..."
    
    ssh "$SERVER_USER@$SERVER_IP" << 'EOF'
        echo "=== 部署状态检查 ==="
        
        # 检查端口状态
        echo "端口 $PORT 状态:"
        sudo netstat -tlnp | grep ":$PORT " || echo "端口 $PORT 未运行"
        
        # 检查进程状态
        echo "Node.js 进程状态:"
        ps aux | grep "bun run dev" | grep -v grep || echo "未找到 bun run dev 进程"
        
        # 检查项目目录
        echo "项目目录状态:"
        ls -la /home/mf/OpenCut/ | head -10
        
        # 检查日志文件
        echo "日志文件状态:"
        if [ -f "/home/mf/OpenCut/out.log" ]; then
            ls -la /home/mf/OpenCut/out.log
            echo "日志文件大小: $(du -h /home/mf/OpenCut/out.log | cut -f1)"
        else
            echo "日志文件不存在"
        fi
EOF
}

# 主函数
main() {
    echo "=========================================="
    echo "        OpenCut 项目部署脚本"
    echo "=========================================="
    echo "项目路径: $LOCAL_PROJECT_PATH"
    echo "服务器: $SERVER_USER@$SERVER_IP"
    echo "部署路径: $SERVER_PATH"
    echo "端口: $PORT"
    echo "=========================================="
    echo ""
    
    # 执行部署步骤
    check_local_project
    create_zip
    execute_remote_commands
    upload_zip
    deploy_and_start
    
    echo ""
    log_success "部署完成！"
    echo ""
    
    # 询问是否查看日志
    read -p "是否查看项目日志？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        view_logs
    fi
    
    # 询问是否检查状态
    read -p "是否检查部署状态？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        check_deployment_status
    fi
    
    echo ""
    log_success "部署脚本执行完成！"
    echo "项目访问地址: http://$SERVER_IP:$PORT"
}

# 错误处理
trap 'log_error "脚本执行出错，退出码: $?"' ERR

# 执行主函数
main "$@"
