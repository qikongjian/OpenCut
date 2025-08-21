#!/bin/bash

# OpenCut 前端部署脚本
# 基于 compile_test.sh 优化，适配 OpenCut 项目

set -e

# 配置变量
PROJECT_NAME="opencut-frontend"
SERVER_USER="mf"
SERVER_HOST="39.105.24.90"
SERVER_PATH="/home/mf/opencut"
BRANCH_NAME="main"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 设置日志文件
LOGFILE="frontend-deploy-$(date +%Y%m%d_%H%M%S).log"

# 记录开始时间
log_info "🚀 OpenCut 前端部署开始 $(date)" | tee $LOGFILE

# 检查本地环境
check_local_env() {
    log_info "检查本地环境..." | tee -a $LOGFILE
    
    # 检查必要工具
    for tool in git node npm; do
        if ! command -v $tool &> /dev/null; then
            log_error "$tool 未安装"
            exit 1
        fi
    done
    
    # 检查 bun 或 npm
    if command -v bun &> /dev/null; then
        PACKAGE_MANAGER="bun"
        log_info "使用 Bun 作为包管理器"
    else
        PACKAGE_MANAGER="npm"
        log_info "使用 npm 作为包管理器"
    fi
    
    log_success "本地环境检查通过" | tee -a $LOGFILE
}

# 检查 Git 状态
check_git_status() {
    log_info "检查 Git 状态..." | tee -a $LOGFILE
    
    # 获取当前分支
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    log_info "当前分支: $current_branch"
    
    # 检查工作区是否干净
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "工作区有未提交的更改，继续部署..."
        git status --short
    else
        log_success "工作区干净"
    fi
    
    # 拉取最新代码
    log_info "拉取最新代码..."
    git pull origin $current_branch || log_warning "拉取代码失败，使用本地版本"
    
    log_success "Git 状态检查完成" | tee -a $LOGFILE
}

# 构建前端项目
build_frontend() {
    log_info "开始构建前端项目..." | tee -a $LOGFILE
    
    # 清理之前的构建
    log_info "清理之前的构建文件..."
    rm -rf .next dist node_modules/.cache
    
    # 安装依赖
    log_info "安装依赖..."
    if [ "$PACKAGE_MANAGER" = "bun" ]; then
        bun install | tee -a $LOGFILE
    else
        npm install | tee -a $LOGFILE
    fi
    
    # 构建 Web 应用
    log_info "构建 Web 应用..."
    cd apps/web
    
    if [ "$PACKAGE_MANAGER" = "bun" ]; then
        bun run build | tee -a ../../$LOGFILE
    else
        npm run build | tee -a ../../$LOGFILE
    fi
    
    cd ../..
    
    log_success "前端项目构建完成" | tee -a $LOGFILE
}

# 准备部署文件
prepare_deployment() {
    log_info "准备部署文件..." | tee -a $LOGFILE
    
    # 创建部署目录
    mkdir -p dist/apps/web
    
    # 复制构建产物
    log_info "复制构建产物..."
    cp -r apps/web/.next dist/apps/web/
    cp -r apps/web/public dist/apps/web/
    cp apps/web/package.json dist/apps/web/
    
    # 复制项目配置文件
    log_info "复制配置文件..."
    cp package.json dist/
    cp turbo.json dist/
    cp .env.production dist/
    
    # 复制 packages
    log_info "复制 packages..."
    mkdir -p dist/packages
    cp -r packages/auth dist/packages/
    cp -r packages/db dist/packages/
    
    # 复制 Docker 相关文件
    log_info "复制 Docker 配置..."
    cp apps/web/Dockerfile dist/apps/web/
    cp docker-compose.prod.yml dist/
    cp nginx.conf dist/
    cp redis.conf dist/
    
    # 复制部署脚本
    cp init-database.sh dist/
    
    log_success "部署文件准备完成" | tee -a $LOGFILE
}

# 创建部署包
create_deployment_package() {
    log_info "创建部署包..." | tee -a $LOGFILE
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local package_name="$PROJECT_NAME-$timestamp.tar.gz"
    
    # 创建 tar 包
    tar --exclude='node_modules' \
        --exclude='.git' \
        --exclude='*.log' \
        -czf $package_name dist/
    
    echo $package_name
    log_success "部署包创建完成: $package_name" | tee -a $LOGFILE
}

# 上传到服务器
upload_to_server() {
    local package_name=$1
    log_info "上传到服务器..." | tee -a $LOGFILE
    
    # 创建服务器目录
    ssh $SERVER_USER@$SERVER_HOST "mkdir -p $SERVER_PATH"
    
    # 上传部署包
    log_info "上传部署包: $package_name"
    scp $package_name $SERVER_USER@$SERVER_HOST:$SERVER_PATH/
    
    log_success "上传完成" | tee -a $LOGFILE
}

# 在服务器上部署
deploy_on_server() {
    local package_name=$1
    log_info "在服务器上部署..." | tee -a $LOGFILE
    
    ssh $SERVER_USER@$SERVER_HOST << EOF
        cd $SERVER_PATH
        
        echo "🔧 解压部署包..."
        tar -xzf $package_name
        
        echo "📁 备份旧版本..."
        if [ -d "current" ]; then
            mv current backup-\$(date +%Y%m%d_%H%M%S) || true
        fi
        
        echo "🔄 切换到新版本..."
        mv dist current
        cd current
        
        echo "🐳 检查 Docker..."
        if ! command -v docker &> /dev/null; then
            echo "❌ Docker 未安装，请先安装 Docker"
            exit 1
        fi
        
        echo "📦 安装 Docker Compose..."
        if ! command -v docker-compose &> /dev/null; then
            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        fi
        
        echo "🏗️ 构建 Docker 镜像..."
        docker build -t opencut-app:latest -f apps/web/Dockerfile .
        
        echo "🚀 启动服务..."
        docker-compose -f docker-compose.prod.yml down || true
        docker-compose -f docker-compose.prod.yml up -d
        
        echo "⏳ 等待服务启动..."
        sleep 30
        
        echo "🗄️ 初始化数据库..."
        chmod +x init-database.sh
        ./init-database.sh || echo "数据库初始化可能失败，请检查"
        
        echo "✅ 部署完成！"
        
        # 显示服务状态
        echo "📊 服务状态:"
        docker-compose -f docker-compose.prod.yml ps
        
        # 清理部署包
        rm ../$package_name
EOF
    
    log_success "服务器部署完成" | tee -a $LOGFILE
}

# 验证部署
verify_deployment() {
    log_info "验证部署..." | tee -a $LOGFILE
    
    # 等待服务启动
    sleep 10
    
    # 检查应用是否响应
    if curl -f -s --connect-timeout 10 http://$SERVER_HOST/api/health > /dev/null; then
        log_success "✅ 应用部署成功！"
        log_success "🌐 访问地址: http://$SERVER_HOST"
    else
        log_warning "⚠️  应用可能还在启动中，请稍后访问: http://$SERVER_HOST"
        
        # 显示服务器状态
        ssh $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH/current && docker-compose -f docker-compose.prod.yml logs --tail 10 opencut-app"
    fi
}

# 清理本地文件
cleanup() {
    log_info "清理本地文件..." | tee -a $LOGFILE
    
    rm -rf dist
    rm -f $PROJECT_NAME-*.tar.gz
    
    log_success "清理完成" | tee -a $LOGFILE
}

# 主函数
main() {
    log_info "🚀 OpenCut 前端部署开始"
    echo "项目: $PROJECT_NAME"
    echo "服务器: $SERVER_HOST"
    echo "用户: $SERVER_USER"
    echo "日志文件: $LOGFILE"
    echo
    
    # 执行部署步骤
    check_local_env
    check_git_status
    build_frontend
    prepare_deployment
    
    local package_name=$(create_deployment_package)
    
    upload_to_server $package_name
    deploy_on_server $package_name
    verify_deployment
    cleanup
    
    log_success "🎉 前端部署完成！" | tee -a $LOGFILE
    log_info "访问地址: http://$SERVER_HOST"
    log_info "日志文件: $LOGFILE"
}

# 错误处理
trap 'log_error "部署过程中发生错误！"; cleanup' ERR

# 执行主函数
main "$@"
