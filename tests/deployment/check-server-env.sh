#!/bin/bash

# SmartCut Frontend 服务器环境检查脚本
# 验证服务器环境是否满足部署要求

set -e

# 配置变量
SERVER_USER="mf"
SERVER_HOST="39.105.24.90"

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

# 检查本地环境
check_local_env() {
    log_info "检查本地环境..."
    
    local errors=0
    
    # 检查SSH连接
    if ssh -o ConnectTimeout=10 $SERVER_USER@$SERVER_HOST "echo 'SSH连接成功'" &> /dev/null; then
        log_success "SSH连接正常"
    else
        log_error "SSH连接失败"
        ((errors++))
    fi
    
    # 检查必要文件
    local required_files=(
        ".env.production"
        "docker-compose.prod.yml"
        "nginx.conf"
        "redis.conf"
        "init-database.sh"
        "apps/web/Dockerfile"
    )
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            log_success "文件存在: $file"
        else
            log_error "文件缺失: $file"
            ((errors++))
        fi
    done
    
    return $errors
}

# 检查服务器环境
check_server_env() {
    log_info "检查服务器环境..."
    
    ssh $SERVER_USER@$SERVER_HOST << 'EOF'
        echo "🖥️ 系统信息:"
        echo "操作系统: $(lsb_release -d 2>/dev/null | cut -f2 || echo 'Unknown')"
        echo "内核版本: $(uname -r)"
        echo "架构: $(uname -m)"
        echo "内存: $(free -h | grep '^Mem:' | awk '{print $2}')"
        echo "磁盘空间: $(df -h / | tail -1 | awk '{print $4}' | sed 's/G/ GB/')"
        echo
        
        echo "🔧 检查必要软件:"
        
        # 检查Docker
        if command -v docker &> /dev/null; then
            echo "✅ Docker: $(docker --version)"
            if docker ps &> /dev/null; then
                echo "✅ Docker 服务运行正常"
            else
                echo "⚠️  Docker 服务未运行或权限不足"
            fi
        else
            echo "❌ Docker 未安装"
        fi
        
        # 检查Docker Compose
        if command -v docker-compose &> /dev/null; then
            echo "✅ Docker Compose: $(docker-compose --version)"
        else
            echo "❌ Docker Compose 未安装"
        fi
        
        # 检查Git
        if command -v git &> /dev/null; then
            echo "✅ Git: $(git --version)"
        else
            echo "❌ Git 未安装"
        fi
        
        # 检查Node.js
        if command -v node &> /dev/null; then
            echo "✅ Node.js: $(node --version)"
        else
            echo "⚠️  Node.js 未安装"
        fi
        
        # 检查Bun
        if command -v bun &> /dev/null; then
            echo "✅ Bun: $(bun --version)"
        else
            echo "⚠️  Bun 未安装"
        fi
        
        # 检查Nginx
        if command -v nginx &> /dev/null; then
            echo "✅ Nginx: $(nginx -v 2>&1)"
            if systemctl is-active nginx &> /dev/null; then
                echo "✅ Nginx 服务运行正常"
            else
                echo "⚠️  Nginx 服务未运行"
            fi
        else
            echo "⚠️  Nginx 未安装"
        fi
        
        echo
        echo "🌐 网络检查:"
        
        # 检查端口占用
        echo "端口占用情况:"
        for port in 80 443 3000 5432 6379; do
            if netstat -tuln 2>/dev/null | grep ":$port " &> /dev/null; then
                echo "⚠️  端口 $port 已被占用"
            else
                echo "✅ 端口 $port 可用"
            fi
        done
        
        echo
        echo "📁 目录权限:"
        
        # 检查项目目录
        if [ -d "/home/mf/opencut" ]; then
            echo "✅ 项目目录存在: /home/mf/opencut"
            echo "目录权限: $(ls -ld /home/mf/opencut | awk '{print $1, $3, $4}')"
        else
            echo "⚠️  项目目录不存在: /home/mf/opencut"
        fi
        
        # 检查Docker权限
        if groups $USER | grep -q docker; then
            echo "✅ 用户在 docker 组中"
        else
            echo "⚠️  用户不在 docker 组中"
        fi
        
        echo
        echo "🔒 防火墙状态:"
        if command -v ufw &> /dev/null; then
            echo "UFW 状态: $(sudo ufw status | head -1)"
        fi
        
        echo
        echo "💾 系统资源:"
        echo "CPU 使用率: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
        echo "内存使用率: $(free | grep Mem | awk '{printf("%.1f%%", $3/$2 * 100.0)}')"
        echo "磁盘使用率: $(df / | tail -1 | awk '{print $5}')"
        
        echo
        echo "🐳 Docker 状态:"
        if command -v docker &> /dev/null && docker ps &> /dev/null; then
            echo "运行中的容器:"
            docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        fi
EOF
}

# 检查环境变量配置
check_env_config() {
    log_info "检查环境变量配置..."
    
    if [ -f ".env.production" ]; then
        log_info "检查 .env.production 文件:"
        
        # 检查必要的环境变量
        local required_vars=(
            "DATABASE_URL"
            "BETTER_AUTH_SECRET"
            "NEXT_PUBLIC_BETTER_AUTH_URL"
        )
        
        for var in "${required_vars[@]}"; do
            if grep -q "^$var=" .env.production; then
                local value=$(grep "^$var=" .env.production | cut -d'=' -f2- | tr -d '"')
                if [[ "$value" == *"your-"* ]] || [[ "$value" == *"change-this"* ]]; then
                    log_warning "$var 使用默认值，需要修改"
                else
                    log_success "$var 已配置"
                fi
            else
                log_error "$var 未配置"
            fi
        done
    else
        log_error ".env.production 文件不存在"
    fi
}

# 主函数
main() {
    log_info "🔍 SmartCut Frontend 服务器环境检查开始"
    echo "服务器: $SERVER_HOST"
    echo "用户: $SERVER_USER"
    echo
    
    # 检查本地环境
    if ! check_local_env; then
        log_error "本地环境检查失败，请修复后重试"
        exit 1
    fi
    
    # 检查服务器环境
    check_server_env
    
    # 检查环境变量配置
    check_env_config
    
    log_success "🎉 环境检查完成！"
    log_info "如果有警告项目，建议在部署前修复"
}

# 执行主函数
main "$@"
