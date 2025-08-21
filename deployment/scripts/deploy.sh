#!/bin/bash

# OpenCut 项目部署脚本
# 作者: AI Assistant
# 日期: 2025-01-08
# 用途: 构建并部署 OpenCut 项目到服务器

set -e  # 遇到错误立即退出

# 配置变量
PROJECT_NAME="opencut"
BRANCH_NAME="main"  # 或者您使用的主分支名
SERVER_USER="mf"
SERVER_HOST="39.105.24.90"
SERVER_PATH="/home/mf/opencut"
DOCKER_IMAGE_NAME="opencut-app"
DOCKER_CONTAINER_NAME="opencut-container"
DOCKER_PORT="3000"

# 设置日志文件路径
LOGFILE="deploy.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# 颜色输出函数
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a $LOGFILE
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a $LOGFILE
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOGFILE
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOGFILE
}

# 记录开始时间
log_info "OpenCut 部署开始于 $TIMESTAMP"

# 检查必要的工具
check_dependencies() {
    log_info "检查依赖工具..."
    
    if ! command -v git &> /dev/null; then
        log_error "Git 未安装"
        exit 1
    fi
    
    if ! command -v bun &> /dev/null; then
        log_error "Bun 未安装"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        exit 1
    fi
    
    if ! command -v ssh &> /dev/null; then
        log_error "SSH 未安装"
        exit 1
    fi
    
    log_success "所有依赖工具检查通过"
}

# 检查 Git 状态
check_git_status() {
    log_info "检查 Git 状态..."
    
    # 获取当前分支名
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    
    # 检查是否在正确的分支
    if [ "$current_branch" != "$BRANCH_NAME" ]; then
        log_warning "当前分支是 $current_branch，不是 $BRANCH_NAME"
        read -p "是否继续部署？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "部署已取消"
            exit 0
        fi
        BRANCH_NAME=$current_branch
    fi
    
    # 检查工作区是否干净
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "工作区有未提交的更改"
        git status --short
        read -p "是否继续部署？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "部署已取消"
            exit 0
        fi
    fi
    
    log_success "Git 状态检查完成"
}

# 构建项目
build_project() {
    log_info "开始构建项目..."
    
    # 安装依赖
    log_info "安装依赖..."
    bun install
    
    # 构建项目
    log_info "构建项目..."
    bun run build
    
    log_success "项目构建完成"
}

# 构建 Docker 镜像
build_docker_image() {
    log_info "构建 Docker 镜像..."
    
    # 构建镜像
    docker build -t $DOCKER_IMAGE_NAME:latest -f apps/web/Dockerfile .
    
    # 保存镜像为 tar 文件
    log_info "导出 Docker 镜像..."
    docker save $DOCKER_IMAGE_NAME:latest | gzip > ${PROJECT_NAME}-docker-image.tar.gz
    
    log_success "Docker 镜像构建完成"
}

# 上传文件到服务器
upload_to_server() {
    log_info "上传文件到服务器..."
    
    # 创建服务器目录
    ssh $SERVER_USER@$SERVER_HOST "mkdir -p $SERVER_PATH"
    
    # 上传 Docker 镜像
    log_info "上传 Docker 镜像..."
    scp ${PROJECT_NAME}-docker-image.tar.gz $SERVER_USER@$SERVER_HOST:$SERVER_PATH/
    
    # 上传部署脚本
    log_info "上传部署脚本..."
    scp ../scripts/deploy-server.sh $SERVER_USER@$SERVER_HOST:$SERVER_PATH/
    
    # 上传环境变量文件（如果存在）
    if [ -f "../config/.env.production" ]; then
        log_info "上传生产环境配置..."
        scp ../config/.env.production $SERVER_USER@$SERVER_HOST:$SERVER_PATH/.env
    fi
    
    log_success "文件上传完成"
}

# 在服务器上部署
deploy_on_server() {
    log_info "在服务器上部署应用..."
    
    ssh $SERVER_USER@$SERVER_HOST << EOF
        cd $SERVER_PATH
        
        # 加载 Docker 镜像
        echo "加载 Docker 镜像..."
        gunzip -c ${PROJECT_NAME}-docker-image.tar.gz | docker load
        
        # 停止并删除旧容器
        echo "停止旧容器..."
        docker stop $DOCKER_CONTAINER_NAME 2>/dev/null || true
        docker rm $DOCKER_CONTAINER_NAME 2>/dev/null || true
        
        # 启动新容器
        echo "启动新容器..."
        docker run -d \
            --name $DOCKER_CONTAINER_NAME \
            --restart unless-stopped \
            -p $DOCKER_PORT:3000 \
            --env-file .env \
            $DOCKER_IMAGE_NAME:latest
        
        # 清理镜像文件
        rm -f ${PROJECT_NAME}-docker-image.tar.gz
        
        # 检查容器状态
        echo "检查容器状态..."
        docker ps | grep $DOCKER_CONTAINER_NAME
        
        echo "部署完成！"
EOF
    
    log_success "服务器部署完成"
}

# 清理本地文件
cleanup() {
    log_info "清理本地文件..."
    
    # 删除 Docker 镜像文件
    rm -f ${PROJECT_NAME}-docker-image.tar.gz
    
    # 删除构建缓存（可选）
    # docker system prune -f
    
    log_success "清理完成"
}

# 验证部署
verify_deployment() {
    log_info "验证部署..."
    
    # 检查服务是否运行
    if curl -f -s http://$SERVER_HOST:$DOCKER_PORT > /dev/null; then
        log_success "应用部署成功！访问地址: http://$SERVER_HOST:$DOCKER_PORT"
    else
        log_warning "应用可能还在启动中，请稍后检查"
    fi
}

# 主函数
main() {
    log_info "开始 OpenCut 项目部署流程"
    
    # 检查依赖
    check_dependencies
    
    # 检查 Git 状态
    check_git_status
    
    # 构建项目
    build_project
    
    # 构建 Docker 镜像
    build_docker_image
    
    # 上传到服务器
    upload_to_server
    
    # 在服务器上部署
    deploy_on_server
    
    # 清理本地文件
    cleanup
    
    # 验证部署
    verify_deployment
    
    log_success "部署流程完成！"
    log_info "部署结束于 $(date '+%Y-%m-%d %H:%M:%S')"
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志文件: $LOGFILE"' ERR

# 执行主函数
main "$@"
