#!/bin/bash

# OpenCut 快速部署脚本
# 一键部署到服务器

set -e

# 配置
SERVER_USER="mf"
SERVER_HOST="39.105.24.90"
PROJECT_NAME="opencut"

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

# 检查必要文件
check_files() {
    log_info "检查必要文件..."
    
    required_files=(
        "../scripts/deploy.sh"
        "../scripts/deploy-server.sh"
        "../config/.env.production"
        "../config/docker-compose.prod.yml"
        "../config/nginx.conf"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "缺少必要文件: $file"
            exit 1
        fi
    done
    
    log_success "所有必要文件检查通过"
}

# 测试服务器连接
test_connection() {
    log_info "测试服务器连接..."
    
    if ssh -o ConnectTimeout=10 $SERVER_USER@$SERVER_HOST "echo 'Connection successful'"; then
        log_success "服务器连接成功"
    else
        log_error "无法连接到服务器 $SERVER_USER@$SERVER_HOST"
        log_info "请检查："
        log_info "1. SSH 密钥是否正确配置"
        log_info "2. 服务器地址是否正确"
        log_info "3. 网络连接是否正常"
        exit 1
    fi
}

# 初始化服务器环境
init_server() {
    log_info "初始化服务器环境..."
    
    # 上传服务器配置脚本
    scp deploy-server.sh $SERVER_USER@$SERVER_HOST:/tmp/
    
    # 在服务器上运行初始化脚本
    ssh $SERVER_USER@$SERVER_HOST "chmod +x /tmp/deploy-server.sh && /tmp/deploy-server.sh"
    
    log_success "服务器环境初始化完成"
}

# 部署应用
deploy_app() {
    log_info "开始部署应用..."
    
    # 运行主部署脚本
    chmod +x deploy.sh
    ./deploy.sh
    
    log_success "应用部署完成"
}

# 验证部署
verify_deployment() {
    log_info "验证部署状态..."
    
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
    fi
    
    # 显示服务器状态
    log_info "检查服务器状态..."
    ssh $SERVER_USER@$SERVER_HOST "docker ps | grep opencut"
}

# 显示部署后信息
show_post_deploy_info() {
    log_info "部署完成！"
    echo
    log_success "🎉 OpenCut 已成功部署到服务器！"
    echo
    log_info "📋 部署信息："
    log_info "   服务器: $SERVER_HOST"
    log_info "   访问地址: http://$SERVER_HOST"
    log_info "   用户: $SERVER_USER"
    echo
    log_info "🔧 管理命令："
    log_info "   查看日志: ssh $SERVER_USER@$SERVER_HOST 'docker logs opencut-container'"
    log_info "   重启应用: ssh $SERVER_USER@$SERVER_HOST 'docker restart opencut-container'"
    log_info "   停止应用: ssh $SERVER_USER@$SERVER_HOST 'docker stop opencut-container'"
    echo
    log_info "📁 重要文件位置："
    log_info "   应用目录: /home/$SERVER_USER/opencut"
    log_info "   配置文件: /home/$SERVER_USER/opencut/.env"
    log_info "   备份目录: /home/$SERVER_USER/backups"
    echo
    log_warning "⚠️  请记得："
    log_warning "   1. 修改 .env.production 中的配置"
    log_warning "   2. 配置域名和 SSL 证书（如需要）"
    log_warning "   3. 定期检查备份"
}

# 主函数
main() {
    echo "🚀 OpenCut 快速部署工具"
    echo "=========================="
    echo
    
    # 检查必要文件
    check_files
    
    # 测试服务器连接
    test_connection
    
    # 询问是否继续
    read -p "是否继续部署到 $SERVER_HOST？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "部署已取消"
        exit 0
    fi
    
    # 询问是否需要初始化服务器
    read -p "是否需要初始化服务器环境？(首次部署选择 y) (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        init_server
    fi
    
    # 部署应用
    deploy_app
    
    # 验证部署
    verify_deployment
    
    # 显示部署后信息
    show_post_deploy_info
}

# 错误处理
trap 'log_error "部署过程中发生错误！"' ERR

# 执行主函数
main "$@"
