#!/bin/bash

# OpenCut 部署环境设置脚本
# 用于初始化和配置部署环境

set -e

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

# 配置变量
SERVER_HOST="39.105.24.90"
SERVER_USER="mf"
PROJECT_NAME="opencut"

# 检查SSH连接
check_ssh_connection() {
    log_info "检查SSH连接到 $SERVER_USER@$SERVER_HOST..."
    
    if ssh -o ConnectTimeout=10 $SERVER_USER@$SERVER_HOST "echo 'SSH连接成功'"; then
        log_success "SSH连接正常"
        return 0
    else
        log_error "SSH连接失败"
        log_info "请检查："
        log_info "1. 服务器地址是否正确"
        log_info "2. SSH密钥是否配置"
        log_info "3. 网络连接是否正常"
        return 1
    fi
}

# 检查本地环境
check_local_environment() {
    log_info "检查本地环境..."
    
    local missing_tools=()
    
    # 检查必要工具
    if ! command -v git &> /dev/null; then
        missing_tools+=("git")
    fi
    
    if ! command -v ssh &> /dev/null; then
        missing_tools+=("ssh")
    fi
    
    if ! command -v scp &> /dev/null; then
        missing_tools+=("scp")
    fi
    
    if ! command -v curl &> /dev/null; then
        missing_tools+=("curl")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "缺少必要工具: ${missing_tools[*]}"
        log_info "请安装缺少的工具后重试"
        return 1
    fi
    
    log_success "本地环境检查通过"
    return 0
}

# 检查配置文件
check_config_files() {
    log_info "检查配置文件..."
    
    local config_dir="../config"
    local missing_files=()
    
    # 检查必要配置文件
    if [ ! -f "$config_dir/.env.production" ]; then
        missing_files+=(".env.production")
    fi
    
    if [ ! -f "$config_dir/docker-compose.prod.yml" ]; then
        missing_files+=("docker-compose.prod.yml")
    fi
    
    if [ ! -f "$config_dir/nginx.conf" ]; then
        missing_files+=("nginx.conf")
    fi
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        log_error "缺少配置文件: ${missing_files[*]}"
        log_info "请确保配置文件存在于 deployment/config/ 目录中"
        return 1
    fi
    
    log_success "配置文件检查通过"
    return 0
}

# 验证环境变量配置
validate_env_config() {
    log_info "验证环境变量配置..."
    
    local env_file="../config/.env.production"
    
    # 检查关键环境变量
    local required_vars=(
        "DATABASE_URL"
        "BETTER_AUTH_SECRET"
        "NEXT_PUBLIC_BETTER_AUTH_URL"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" "$env_file"; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_warning "环境变量配置可能不完整: ${missing_vars[*]}"
        log_info "请检查 $env_file 文件"
    else
        log_success "环境变量配置验证通过"
    fi
}

# 设置脚本权限
setup_script_permissions() {
    log_info "设置脚本执行权限..."
    
    # 给所有脚本添加执行权限
    chmod +x *.sh
    chmod +x ../testing/*.sh
    
    log_success "脚本权限设置完成"
}

# 显示部署信息
show_deployment_info() {
    echo
    log_success "🎉 部署环境设置完成！"
    echo
    log_info "📋 部署信息："
    log_info "   目标服务器: $SERVER_HOST"
    log_info "   用户名: $SERVER_USER"
    log_info "   项目名: $PROJECT_NAME"
    echo
    log_info "🚀 可用的部署命令："
    log_info "   快速部署: ./quick-deploy.sh"
    log_info "   TAR包部署: ./deploy-tar.sh"
    log_info "   标准部署: ./deploy.sh"
    echo
    log_info "🔧 测试命令："
    log_info "   环境检查: ../testing/check-server-env.sh"
    log_info "   部署测试: ../testing/test-deployment.sh"
    echo
    log_info "📚 文档位置: ../docs/"
    echo
}

# 主函数
main() {
    echo "🔧 OpenCut 部署环境设置"
    echo "========================"
    echo
    
    # 执行检查
    if ! check_local_environment; then
        exit 1
    fi
    
    if ! check_config_files; then
        exit 1
    fi
    
    validate_env_config
    
    if ! check_ssh_connection; then
        log_warning "SSH连接检查失败，但可以继续设置"
    fi
    
    setup_script_permissions
    
    show_deployment_info
}

# 执行主函数
main "$@"
