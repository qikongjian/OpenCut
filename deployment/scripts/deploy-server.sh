#!/bin/bash

# SmartCut Frontend 服务器端部署脚本
# 在服务器上运行的部署脚本

set -e

# 配置变量
PROJECT_NAME="opencut"
DOCKER_IMAGE_NAME="opencut-app"
DOCKER_CONTAINER_NAME="opencut-container"
DOCKER_PORT="3000"
NGINX_CONFIG_PATH="/etc/nginx/sites-available/opencut"
NGINX_ENABLED_PATH="/etc/nginx/sites-enabled/opencut"

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

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，正在安装..."
        install_docker
    else
        log_success "Docker 已安装"
    fi
}

# 安装 Docker
install_docker() {
    log_info "安装 Docker..."
    
    # 更新包索引
    sudo apt-get update
    
    # 安装必要的包
    sudo apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # 添加 Docker 官方 GPG 密钥
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # 设置稳定版仓库
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # 安装 Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # 启动 Docker 服务
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # 将当前用户添加到 docker 组
    sudo usermod -aG docker $USER
    
    log_success "Docker 安装完成"
}

# 检查 Nginx 是否安装
check_nginx() {
    if ! command -v nginx &> /dev/null; then
        log_info "安装 Nginx..."
        sudo apt-get update
        sudo apt-get install -y nginx
        sudo systemctl start nginx
        sudo systemctl enable nginx
        log_success "Nginx 安装完成"
    else
        log_success "Nginx 已安装"
    fi
}

# 配置 Nginx 反向代理
configure_nginx() {
    log_info "配置 Nginx 反向代理..."
    
    # 创建 Nginx 配置文件
    sudo tee $NGINX_CONFIG_PATH > /dev/null << EOF
server {
    listen 80;
    server_name $SERVER_HOST;

    # 客户端最大请求体大小（用于文件上传）
    client_max_body_size 100M;

    # 代理到 SmartCut Frontend 应用
    location / {
        proxy_pass http://localhost:$DOCKER_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:$DOCKER_PORT;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 健康检查
    location /health {
        proxy_pass http://localhost:$DOCKER_PORT/health;
        access_log off;
    }
}
EOF

    # 启用站点
    sudo ln -sf $NGINX_CONFIG_PATH $NGINX_ENABLED_PATH
    
    # 测试 Nginx 配置
    sudo nginx -t
    
    # 重新加载 Nginx
    sudo systemctl reload nginx
    
    log_success "Nginx 配置完成"
}

# 设置防火墙
configure_firewall() {
    log_info "配置防火墙..."
    
    # 检查 ufw 是否安装
    if command -v ufw &> /dev/null; then
        # 允许 SSH
        sudo ufw allow ssh
        
        # 允许 HTTP 和 HTTPS
        sudo ufw allow 80
        sudo ufw allow 443
        
        # 启用防火墙（如果还未启用）
        sudo ufw --force enable
        
        log_success "防火墙配置完成"
    else
        log_warning "UFW 未安装，跳过防火墙配置"
    fi
}

# 创建系统服务
create_systemd_service() {
    log_info "创建 systemd 服务..."
    
    sudo tee /etc/systemd/system/opencut.service > /dev/null << EOF
[Unit]
Description=SmartCut Frontend Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/bin/docker start $DOCKER_CONTAINER_NAME
ExecStop=/usr/bin/docker stop $DOCKER_CONTAINER_NAME
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

    # 重新加载 systemd
    sudo systemctl daemon-reload
    
    # 启用服务
    sudo systemctl enable opencut.service
    
    log_success "systemd 服务创建完成"
}

# 设置日志轮转
setup_log_rotation() {
    log_info "设置日志轮转..."
    
    sudo tee /etc/logrotate.d/opencut > /dev/null << EOF
/var/lib/docker/containers/*/*-json.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
    postrotate
        /bin/kill -USR1 \$(cat /var/run/docker.pid) 2>/dev/null || true
    endscript
}
EOF

    log_success "日志轮转配置完成"
}

# 创建备份脚本
create_backup_script() {
    log_info "创建备份脚本..."
    
    sudo tee /usr/local/bin/opencut-backup.sh > /dev/null << 'EOF'
#!/bin/bash

# SmartCut Frontend 备份脚本
BACKUP_DIR="/home/mf/backups"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="opencut-container"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份容器数据
docker exec $CONTAINER_NAME tar czf - /app > $BACKUP_DIR/opencut_data_$DATE.tar.gz

# 备份 Docker 镜像
docker save opencut-app:latest | gzip > $BACKUP_DIR/opencut_image_$DATE.tar.gz

# 删除 7 天前的备份
find $BACKUP_DIR -name "opencut_*" -mtime +7 -delete

echo "备份完成: $DATE"
EOF

    sudo chmod +x /usr/local/bin/opencut-backup.sh
    
    # 添加到 crontab（每天凌晨 2 点备份）
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/opencut-backup.sh") | crontab -
    
    log_success "备份脚本创建完成"
}

# 主函数
main() {
    log_info "开始服务器环境配置..."
    
    # 更新系统
    log_info "更新系统包..."
    sudo apt-get update && sudo apt-get upgrade -y
    
    # 检查并安装 Docker
    check_docker
    
    # 检查并安装 Nginx
    check_nginx
    
    # 配置 Nginx
    configure_nginx
    
    # 配置防火墙
    configure_firewall
    
    # 创建系统服务
    create_systemd_service
    
    # 设置日志轮转
    setup_log_rotation
    
    # 创建备份脚本
    create_backup_script
    
    log_success "服务器环境配置完成！"
    log_info "请重新登录以使 Docker 组权限生效"
}

# 如果直接运行此脚本
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
