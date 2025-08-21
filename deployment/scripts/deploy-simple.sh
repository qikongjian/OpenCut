#!/bin/bash

# OpenCut 简化部署脚本
# 不依赖本地 Docker，直接在服务器上构建

set -e

# 配置变量
PROJECT_NAME="opencut"
SERVER_USER="mf"
SERVER_HOST="39.105.24.90"
SERVER_PATH="/home/mf/opencut"
DOCKER_IMAGE_NAME="opencut-app"
DOCKER_CONTAINER_NAME="opencut-container"
DOCKER_PORT="3000"

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

# 检查必要工具
check_dependencies() {
    log_info "检查本地依赖..."
    
    if ! command -v git &> /dev/null; then
        log_error "Git 未安装"
        exit 1
    fi
    
    if ! command -v ssh &> /dev/null; then
        log_error "SSH 未安装"
        exit 1
    fi
    
    if ! command -v rsync &> /dev/null; then
        log_warning "rsync 未安装，将使用 scp"
    fi
    
    log_success "本地依赖检查通过"
}

# 准备项目文件
prepare_project() {
    log_info "准备项目文件..."

    # 创建临时目录
    TEMP_DIR=$(mktemp -d)
    log_info "临时目录: $TEMP_DIR"

    # 复制项目文件（排除不必要的文件）
    if command -v rsync &> /dev/null; then
        rsync -av --exclude='node_modules' \
                  --exclude='.git' \
                  --exclude='.next' \
                  --exclude='dist' \
                  --exclude='*.log' \
                  --exclude='.env.local' \
                  . "$TEMP_DIR/"
    else
        # 使用 cp 作为备选
        cp -r . "$TEMP_DIR/"
        # 删除不需要的目录
        rm -rf "$TEMP_DIR/node_modules" "$TEMP_DIR/.git" "$TEMP_DIR/.next" "$TEMP_DIR/dist" 2>/dev/null || true
    fi

    # 复制部署相关文件
    cp .env.production "$TEMP_DIR/" 2>/dev/null || log_warning ".env.production 不存在"
    cp docker-compose.prod.yml "$TEMP_DIR/" 2>/dev/null || log_warning "docker-compose.prod.yml 不存在"
    cp nginx.conf "$TEMP_DIR/" 2>/dev/null || log_warning "nginx.conf 不存在"

    echo "$TEMP_DIR"
}

# 上传项目到服务器
upload_project() {
    local temp_dir=$1
    log_info "上传项目到服务器..."

    # 创建服务器目录
    ssh $SERVER_USER@$SERVER_HOST "mkdir -p $SERVER_PATH"

    # 上传项目文件
    log_info "上传项目文件..."
    if command -v rsync &> /dev/null; then
        rsync -av --delete "$temp_dir/" $SERVER_USER@$SERVER_HOST:$SERVER_PATH/
    else
        # 使用 scp 作为备选
        scp -r "$temp_dir/"* $SERVER_USER@$SERVER_HOST:$SERVER_PATH/
    fi

    # 清理临时目录
    rm -rf "$temp_dir"

    log_success "项目上传完成"
}

# 在服务器上构建和部署
deploy_on_server() {
    log_info "在服务器上构建和部署..."
    
    ssh $SERVER_USER@$SERVER_HOST << 'EOF'
        cd /home/mf/opencut
        
        echo "🔧 安装系统依赖..."
        
        # 更新系统
        sudo apt-get update
        
        # 安装 Docker（如果未安装）
        if ! command -v docker &> /dev/null; then
            echo "安装 Docker..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
            sudo systemctl start docker
            sudo systemctl enable docker
        fi
        
        # 安装 Docker Compose（如果未安装）
        if ! command -v docker-compose &> /dev/null; then
            echo "安装 Docker Compose..."
            sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        fi
        
        # 安装 Node.js 和 Bun（如果未安装）
        if ! command -v bun &> /dev/null; then
            echo "安装 Bun..."
            curl -fsSL https://bun.sh/install | bash
            source ~/.bashrc
        fi
        
        echo "🏗️ 构建项目..."
        
        # 安装依赖
        bun install
        
        # 构建项目
        cd apps/web
        bun run build
        cd ../..
        
        echo "🐳 构建 Docker 镜像..."
        
        # 构建 Docker 镜像
        docker build -t opencut-app:latest -f apps/web/Dockerfile .
        
        echo "🚀 部署应用..."
        
        # 停止旧容器
        docker stop opencut-container 2>/dev/null || true
        docker rm opencut-container 2>/dev/null || true
        
        # 启动新容器
        docker run -d \
            --name opencut-container \
            --restart unless-stopped \
            -p 3000:3000 \
            --env-file .env.production \
            opencut-app:latest
        
        echo "✅ 部署完成！"
        
        # 显示容器状态
        docker ps | grep opencut || echo "容器可能还在启动中..."
EOF
    
    log_success "服务器部署完成"
}

# 配置 Nginx（可选）
setup_nginx() {
    log_info "配置 Nginx..."
    
    ssh $SERVER_USER@$SERVER_HOST << 'EOF'
        # 安装 Nginx（如果未安装）
        if ! command -v nginx &> /dev/null; then
            echo "安装 Nginx..."
            sudo apt-get update
            sudo apt-get install -y nginx
            sudo systemctl start nginx
            sudo systemctl enable nginx
        fi
        
        # 配置 Nginx
        sudo tee /etc/nginx/sites-available/opencut > /dev/null << 'NGINX_EOF'
server {
    listen 80;
    server_name 39.105.24.90;
    
    client_max_body_size 100M;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_EOF
        
        # 启用站点
        sudo ln -sf /etc/nginx/sites-available/opencut /etc/nginx/sites-enabled/
        
        # 删除默认站点
        sudo rm -f /etc/nginx/sites-enabled/default
        
        # 测试配置
        sudo nginx -t
        
        # 重新加载 Nginx
        sudo systemctl reload nginx
        
        echo "Nginx 配置完成"
EOF
    
    log_success "Nginx 配置完成"
}

# 验证部署
verify_deployment() {
    log_info "验证部署..."
    
    # 等待应用启动
    log_info "等待应用启动..."
    sleep 30
    
    # 检查应用是否响应
    if curl -f -s http://$SERVER_HOST > /dev/null; then
        log_success "✅ 应用部署成功！"
        log_success "🌐 访问地址: http://$SERVER_HOST"
    else
        log_warning "⚠️  应用可能还在启动中"
        log_info "请稍后访问: http://$SERVER_HOST"
        
        # 显示服务器状态
        log_info "检查服务器状态..."
        ssh $SERVER_USER@$SERVER_HOST "docker ps; docker logs opencut-container --tail 20"
    fi
}

# 主函数
main() {
    log_info "🚀 OpenCut 简化部署开始"
    
    # 检查依赖
    check_dependencies
    
    # 准备项目文件
    temp_dir=$(prepare_project)
    
    # 上传项目
    upload_project "$temp_dir"
    
    # 在服务器上部署
    deploy_on_server
    
    # 配置 Nginx
    setup_nginx
    
    # 验证部署
    verify_deployment
    
    log_success "🎉 部署完成！"
    log_info "访问地址: http://$SERVER_HOST"
}

# 错误处理
trap 'log_error "部署过程中发生错误！"' ERR

# 执行主函数
main "$@"
