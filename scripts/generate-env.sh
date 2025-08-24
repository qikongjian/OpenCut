#!/bin/bash

# SmartCut Frontend 环境变量生成脚本
# 用途: 自动生成环境变量配置文件

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

# 生成随机密钥
generate_secret() {
    local length=${1:-32}
    if command -v openssl &> /dev/null; then
        openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
    elif command -v head &> /dev/null && [ -r /dev/urandom ]; then
        head /dev/urandom | tr -dc A-Za-z0-9 | head -c $length
    else
        # 备用方法
        date +%s | sha256sum | base64 | head -c $length
    fi
}

# 生成UUID
generate_uuid() {
    if command -v uuidgen &> /dev/null; then
        uuidgen | tr '[:upper:]' '[:lower:]'
    else
        # 备用UUID生成
        printf '%08x-%04x-%04x-%04x-%012x\n' \
            $((RANDOM * RANDOM)) \
            $((RANDOM % 65536)) \
            $((RANDOM % 65536)) \
            $((RANDOM % 65536)) \
            $((RANDOM * RANDOM * RANDOM))
    fi
}

# 询问用户输入
ask_user() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " input
        if [ -z "$input" ]; then
            input="$default"
        fi
    else
        read -p "$prompt: " input
    fi
    
    eval "$var_name='$input'"
}

# 询问是否覆盖现有文件
confirm_overwrite() {
    local file="$1"
    
    if [ -f "$file" ]; then
        log_warning "文件 $file 已存在"
        read -p "是否覆盖？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 1
        fi
    fi
    return 0
}

# 生成开发环境配置
generate_dev_env() {
    log_info "生成开发环境配置..."
    
    local env_file=".env.local"
    
    if ! confirm_overwrite "$env_file"; then
        log_info "跳过 $env_file 生成"
        return
    fi
    
    # 收集用户输入
    echo
    log_info "请提供以下配置信息（按回车使用默认值）:"
    
    ask_user "数据库URL" "postgresql://opencut:opencutthegoat@localhost:5432/opencut" "db_url"
    ask_user "认证服务URL" "http://localhost:3000" "auth_url"
    ask_user "Redis URL" "http://localhost:8079" "redis_url"
    
    # 生成密钥
    local auth_secret=$(generate_secret 32)
    local redis_token=$(generate_secret 24)
    
    # 创建环境文件
    cat > "$env_file" << EOF
# SmartCut Frontend 开发环境配置
# 自动生成时间: $(date)
# 
# 注意: 此文件包含敏感信息，不应提交到版本控制

# 应用基础配置
NODE_ENV=development
ANALYZE=false

# 数据库配置
DATABASE_URL="$db_url"

# 认证配置
BETTER_AUTH_SECRET="$auth_secret"
NEXT_PUBLIC_BETTER_AUTH_URL="$auth_url"

# Redis 配置
UPSTASH_REDIS_REST_URL="$redis_url"
UPSTASH_REDIS_REST_TOKEN="$redis_token"

# Freesound API (可选 - 用于音效搜索)
# 在 https://freesound.org/apiv2/apply/ 申请
FREESOUND_CLIENT_ID="your-freesound-client-id"
FREESOUND_API_KEY="your-freesound-api-key"

# Cloudflare R2 存储 (可选 - 用于文件存储)
CLOUDFLARE_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="opencut-development"

# Modal 转录服务 (可选 - 用于AI语音转录)
MODAL_TRANSCRIPTION_URL="https://your-modal-endpoint.modal.run"

# AI剪辑计划API (可选)
AI_EDITING_PLAN_API_URL="https://77.smartvideo.py.qikongjian.com"
NEXT_PUBLIC_AI_EDITING_PLAN_API_URL="https://77.smartvideo.py.qikongjian.com"

# Marble CMS (可选 - 用于博客功能)
MARBLE_WORKSPACE_KEY="your-marble-workspace-key"
NEXT_PUBLIC_MARBLE_API_URL="https://api.marblecms.com"
EOF
    
    log_success "开发环境配置已生成: $env_file"
    log_warning "请根据需要修改可选配置项"
}

# 生成Web应用环境配置
generate_web_env() {
    log_info "生成Web应用环境配置..."
    
    local env_file="apps/web/.env.local"
    
    # 确保目录存在
    mkdir -p "$(dirname "$env_file")"
    
    if ! confirm_overwrite "$env_file"; then
        log_info "跳过 $env_file 生成"
        return
    fi
    
    # 如果根目录的 .env.local 存在，从中读取配置
    local db_url="postgresql://opencut:opencutthegoat@localhost:5432/opencut"
    local auth_url="http://localhost:3000"
    local redis_url="http://localhost:8079"
    local auth_secret=$(generate_secret 32)
    local redis_token=$(generate_secret 24)
    
    if [ -f ".env.local" ]; then
        log_info "从根目录 .env.local 读取配置..."
        source .env.local
        db_url="${DATABASE_URL:-$db_url}"
        auth_url="${NEXT_PUBLIC_BETTER_AUTH_URL:-$auth_url}"
        redis_url="${UPSTASH_REDIS_REST_URL:-$redis_url}"
        auth_secret="${BETTER_AUTH_SECRET:-$auth_secret}"
        redis_token="${UPSTASH_REDIS_REST_TOKEN:-$redis_token}"
    fi
    
    # 创建Web应用环境文件
    cat > "$env_file" << EOF
# SmartCut Frontend Web应用环境配置
# 自动生成时间: $(date)

# 数据库配置
DATABASE_URL="$db_url"

# 认证配置
NEXT_PUBLIC_BETTER_AUTH_URL=$auth_url
BETTER_AUTH_SECRET=$auth_secret

# 开发环境
NODE_ENV=development

# Redis 配置
UPSTASH_REDIS_REST_URL=$redis_url
UPSTASH_REDIS_REST_TOKEN=$redis_token

# Marble Blog CMS (可选)
MARBLE_WORKSPACE_KEY=your-marble-workspace-key
NEXT_PUBLIC_MARBLE_API_URL=https://api.marblecms.com

# Freesound API (可选)
FREESOUND_CLIENT_ID=your-freesound-client-id
FREESOUND_API_KEY=your-freesound-api-key

# Cloudflare R2 存储 (可选)
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=opencut-transcription

# Modal 转录服务 (可选)
MODAL_TRANSCRIPTION_URL=https://your-modal-endpoint.modal.run
EOF
    
    log_success "Web应用环境配置已生成: $env_file"
}

# 生成生产环境配置
generate_prod_env() {
    log_info "生成生产环境配置..."
    
    local env_file=".env.production"
    
    if ! confirm_overwrite "$env_file"; then
        log_info "跳过 $env_file 生成"
        return
    fi
    
    echo
    log_info "请提供生产环境配置信息:"
    
    ask_user "服务器域名或IP" "your-domain.com" "server_domain"
    ask_user "数据库密码" "$(generate_secret 16)" "db_password"
    ask_user "Redis密码" "$(generate_secret 16)" "redis_password"
    
    # 生成强密钥
    local auth_secret="opencut-prod-$(date +%Y)-$(generate_secret 32)"
    local postgres_user="opencut"
    local postgres_db="opencut"
    
    # 创建生产环境文件
    cat > "$env_file" << EOF
# SmartCut Frontend 生产环境配置
# 自动生成时间: $(date)
# 
# ⚠️ 重要: 请确保修改所有默认值和密钥

# 应用基础配置
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# 数据库配置 - 使用Docker容器内的PostgreSQL
DATABASE_URL="postgresql://$postgres_user:$db_password@postgres:5432/$postgres_db"

# 认证配置 - 生产环境需要修改为实际域名
BETTER_AUTH_SECRET="$auth_secret"
NEXT_PUBLIC_BETTER_AUTH_URL="http://$server_domain"

# Redis 配置 - 使用Docker容器内的Redis
UPSTASH_REDIS_REST_URL="http://redis:6379"
UPSTASH_REDIS_REST_TOKEN="$redis_password"

# Freesound API 配置 - 可选，用于音效搜索
FREESOUND_CLIENT_ID="your-freesound-client-id"
FREESOUND_API_KEY="your-freesound-api-key"

# Cloudflare R2 配置 - 可选，用于文件存储
CLOUDFLARE_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="opencut-production"

# Modal 转录服务 - 可选，用于AI语音转录
MODAL_TRANSCRIPTION_URL="https://your-modal-endpoint.modal.run"

# AI剪辑计划API配置
AI_EDITING_PLAN_API_URL="https://77.smartvideo.py.qikongjian.com"
NEXT_PUBLIC_AI_EDITING_PLAN_API_URL="https://77.smartvideo.py.qikongjian.com"

# 其他配置
ANALYZE="false"

# 数据库凭据（用于Docker Compose）
POSTGRES_USER=$postgres_user
POSTGRES_PASSWORD=$db_password
POSTGRES_DB=$postgres_db

# Redis配置（用于Docker Compose）
REDIS_PASSWORD=$redis_password
EOF
    
    log_success "生产环境配置已生成: $env_file"
    log_warning "请务必修改所有 'your-' 开头的配置项"
    log_warning "建议在生产环境中使用HTTPS"
}

# 显示使用说明
show_usage() {
    echo "SmartCut Frontend 环境变量生成工具"
    echo "========================"
    echo
    echo "用法: $0 [选项]"
    echo
    echo "选项:"
    echo "  -d, --dev      生成开发环境配置"
    echo "  -w, --web      生成Web应用配置"
    echo "  -p, --prod     生成生产环境配置"
    echo "  -a, --all      生成所有配置文件"
    echo "  -h, --help     显示此帮助信息"
    echo
    echo "示例:"
    echo "  $0 --dev       # 生成开发环境配置"
    echo "  $0 --all       # 生成所有配置文件"
}

# 主函数
main() {
    echo "🔧 SmartCut Frontend 环境变量生成工具"
    echo "============================"
    echo
    
    # 解析命令行参数
    case "${1:-}" in
        -d|--dev)
            generate_dev_env
            ;;
        -w|--web)
            generate_web_env
            ;;
        -p|--prod)
            generate_prod_env
            ;;
        -a|--all)
            generate_dev_env
            echo
            generate_web_env
            echo
            generate_prod_env
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        "")
            log_info "未指定选项，生成开发环境配置..."
            generate_dev_env
            ;;
        *)
            log_error "未知选项: $1"
            show_usage
            exit 1
            ;;
    esac
    
    echo
    log_success "✅ 环境变量生成完成！"
    echo
    log_info "下一步:"
    log_info "1. 检查生成的配置文件"
    log_info "2. 修改可选配置项"
    log_info "3. 运行验证脚本: ./scripts/validate-env.sh"
    log_info "4. 启动应用进行测试"
}

# 执行主函数
main "$@"
