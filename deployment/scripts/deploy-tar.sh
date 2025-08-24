#!/bin/bash

# SmartCut Frontend 部署脚本 - 使用 tar 打包上传
# 简单可靠的部署方案

set -e

# 配置变量
PROJECT_NAME="opencut"
SERVER_USER="mf"
SERVER_HOST="39.105.24.90"
SERVER_PATH="/home/mf/opencut"

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
    
    if ! command -v tar &> /dev/null; then
        log_error "tar 未安装"
        exit 1
    fi
    
    log_success "本地依赖检查通过"
}

# 打包项目
package_project() {
    log_info "打包项目文件..."
    
    # 创建打包文件
    tar --exclude='node_modules' \
        --exclude='.git' \
        --exclude='.next' \
        --exclude='dist' \
        --exclude='*.log' \
        --exclude='.env.local' \
        --exclude='deploy.log' \
        -czf ${PROJECT_NAME}-deploy.tar.gz .
    
    log_success "项目打包完成: ${PROJECT_NAME}-deploy.tar.gz"
}

# 上传并解压
upload_and_extract() {
    log_info "上传项目到服务器..."
    
    # 创建服务器目录
    ssh $SERVER_USER@$SERVER_HOST "mkdir -p $SERVER_PATH"
    
    # 上传压缩包
    scp ${PROJECT_NAME}-deploy.tar.gz $SERVER_USER@$SERVER_HOST:$SERVER_PATH/
    
    # 在服务器上解压
    ssh $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && tar -xzf ${PROJECT_NAME}-deploy.tar.gz && rm ${PROJECT_NAME}-deploy.tar.gz"
    
    # 清理本地文件
    rm ${PROJECT_NAME}-deploy.tar.gz
    
    log_success "项目上传完成"
}

# 在服务器上部署
deploy_on_server() {
    log_info "在服务器上部署..."

    ssh $SERVER_USER@$SERVER_HOST << 'EOF'
        cd /home/mf/opencut

        echo "🔧 检查和安装系统依赖..."

        # 更新系统
        sudo apt-get update -y

        # 安装基础工具
        sudo apt-get install -y curl wget git unzip make

        # 安装 Docker（如果未安装）
        if ! command -v docker &> /dev/null; then
            echo "安装 Docker..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
            sudo systemctl start docker
            sudo systemctl enable docker
            rm get-docker.sh
            echo "Docker 安装完成，需要重新登录以使用 docker 命令"
        else
            echo "Docker 已安装"
        fi

        # 安装 Docker Compose（如果未安装）
        if ! command -v docker-compose &> /dev/null; then
            echo "安装 Docker Compose..."
            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        else
            echo "Docker Compose 已安装"
        fi

        # 安装 Node.js 和 Bun（如果未安装）
        if ! command -v node &> /dev/null; then
            echo "安装 Node.js..."
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        fi

        if ! command -v bun &> /dev/null; then
            echo "安装 Bun..."
            curl -fsSL https://bun.sh/install | bash
            export PATH="$HOME/.bun/bin:$PATH"
            echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
        else
            echo "Bun 已安装"
        fi

        # 确保 bun 在 PATH 中
        export PATH="$HOME/.bun/bin:$PATH"

        echo "🏗️ 构建项目..."

        # 安装依赖
        if command -v bun &> /dev/null; then
            bun install
        else
            npm install
        fi

        # 构建项目
        cd apps/web
        if command -v bun &> /dev/null; then
            bun run build
        else
            npm run build
        fi
        cd ../..

        echo "🐳 使用 Docker Compose 部署..."

        # 检查 Docker 是否可用
        if ! docker ps &> /dev/null; then
            echo "Docker 服务未运行或当前用户无权限，尝试启动..."
            sudo systemctl start docker
            sleep 5
        fi

        # 设置 Docker 命令
        if docker ps &> /dev/null; then
            DOCKER_CMD="docker"
            COMPOSE_CMD="docker-compose"
        else
            echo "使用 sudo 运行 Docker 命令..."
            DOCKER_CMD="sudo docker"
            COMPOSE_CMD="sudo docker-compose"
        fi

        # 构建 Docker 镜像
        echo "构建应用镜像..."
        $DOCKER_CMD build -t opencut-app:latest -f apps/web/Dockerfile .

        # 停止旧的容器
        echo "停止旧容器..."
        $COMPOSE_CMD -f docker-compose.prod.yml down || true

        # 启动新的容器组
        echo "启动新容器组..."
        $COMPOSE_CMD -f docker-compose.prod.yml up -d

        # 等待服务启动
        echo "等待服务启动..."
        sleep 30

        # 初始化数据库
        echo "初始化数据库..."
        chmod +x init-database.sh
        ./init-database.sh || echo "数据库初始化可能失败，请手动检查"

        echo "✅ 部署完成！"

        # 显示容器状态
        echo "容器状态："
        $COMPOSE_CMD -f docker-compose.prod.yml ps

        # 显示日志
        echo "最近的日志："
        $COMPOSE_CMD -f docker-compose.prod.yml logs --tail 20 opencut-app || true
EOF

    log_success "服务器部署完成"
}

# 配置 Nginx
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
        else
            echo "Nginx 已安装"
        fi
        
        # 配置 Nginx
        sudo tee /etc/nginx/sites-available/opencut > /dev/null << 'NGINX_EOF'
server {
    listen 80;
    server_name 39.105.24.90 _;
    
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
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
NGINX_EOF
        
        # 启用站点
        sudo ln -sf /etc/nginx/sites-available/opencut /etc/nginx/sites-enabled/
        
        # 删除默认站点
        sudo rm -f /etc/nginx/sites-enabled/default
        
        # 测试配置
        if sudo nginx -t; then
            # 重新加载 Nginx
            sudo systemctl reload nginx
            echo "Nginx 配置成功"
        else
            echo "Nginx 配置有误"
        fi
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
    log_info "检查应用状态..."
    if curl -f -s http://$SERVER_HOST > /dev/null; then
        log_success "✅ 应用部署成功！"
        log_success "🌐 访问地址: http://$SERVER_HOST"
    else
        log_warning "⚠️  应用可能还在启动中"
        log_info "请稍后访问: http://$SERVER_HOST"
        
        # 显示服务器状态
        log_info "检查服务器状态..."
        ssh $SERVER_USER@$SERVER_HOST "docker ps 2>/dev/null || sudo docker ps; echo '--- 容器日志 ---'; docker logs opencut-container --tail 20 2>/dev/null || sudo docker logs opencut-container --tail 20"
    fi
}

# 主函数
main() {
    log_info "🚀 SmartCut Frontend 部署开始"
    echo "服务器: $SERVER_HOST"
    echo "用户: $SERVER_USER"
    echo
    
    # 检查依赖
    check_dependencies
    
    # 打包项目
    package_project
    
    # 上传并解压
    upload_and_extract
    
    # 在服务器上部署
    deploy_on_server
    
    # 配置 Nginx
    setup_nginx
    
    # 验证部署
    verify_deployment
    
    log_success "🎉 部署完成！"
    log_info "访问地址: http://$SERVER_HOST"
    log_info "管理命令: ssh $SERVER_USER@$SERVER_HOST"
}

# 错误处理
trap 'log_error "部署过程中发生错误！"' ERR

# 执行主函数
main "$@"
