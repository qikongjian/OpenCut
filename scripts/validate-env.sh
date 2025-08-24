#!/bin/bash

# SmartCut Frontend 环境变量验证脚本
# 用途: 验证环境变量配置是否完整和正确

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

# 检查环境变量文件是否存在
check_env_files() {
    log_info "检查环境变量文件..."
    
    local files_checked=0
    local files_found=0
    
    # 检查根目录环境文件
    if [ -f ".env.local" ]; then
        log_success "找到 .env.local"
        ((files_found++))
    else
        log_warning ".env.local 不存在"
    fi
    ((files_checked++))
    
    # 检查Web应用环境文件
    if [ -f "apps/web/.env.local" ]; then
        log_success "找到 apps/web/.env.local"
        ((files_found++))
    else
        log_warning "apps/web/.env.local 不存在"
    fi
    ((files_checked++))
    
    # 检查生产环境文件
    if [ -f ".env.production" ]; then
        log_success "找到 .env.production"
        ((files_found++))
    else
        log_warning ".env.production 不存在"
    fi
    ((files_checked++))
    
    echo "环境文件检查: $files_found/$files_checked 个文件存在"
}

# 验证必需的环境变量
validate_required_vars() {
    log_info "验证必需的环境变量..."
    
    # 加载环境变量
    if [ -f ".env.local" ]; then
        source .env.local
    fi
    
    # 必需的环境变量列表
    local required_vars=(
        "DATABASE_URL"
        "BETTER_AUTH_SECRET"
        "NEXT_PUBLIC_BETTER_AUTH_URL"
        "UPSTASH_REDIS_REST_URL"
        "UPSTASH_REDIS_REST_TOKEN"
    )
    
    local missing_vars=()
    local weak_vars=()
    
    for var in "${required_vars[@]}"; do
        local value="${!var}"
        
        if [ -z "$value" ]; then
            missing_vars+=("$var")
        else
            # 检查是否使用了默认值或弱密码
            case "$var" in
                "BETTER_AUTH_SECRET")
                    if [[ "$value" == *"your-"* ]] || [[ "$value" == *"secret"* ]] || [ ${#value} -lt 20 ]; then
                        weak_vars+=("$var (密钥太弱或使用默认值)")
                    fi
                    ;;
                "NEXT_PUBLIC_BETTER_AUTH_URL")
                    if [[ "$value" == *"localhost"* ]] && [[ "$NODE_ENV" == "production" ]]; then
                        weak_vars+=("$var (生产环境不应使用localhost)")
                    fi
                    ;;
                *)
                    if [[ "$value" == *"your-"* ]] || [[ "$value" == *"placeholder"* ]] || [[ "$value" == *"dummy"* ]]; then
                        weak_vars+=("$var (使用默认值)")
                    fi
                    ;;
            esac
            log_success "$var 已设置"
        fi
    done
    
    # 报告结果
    if [ ${#missing_vars[@]} -eq 0 ] && [ ${#weak_vars[@]} -eq 0 ]; then
        log_success "所有必需的环境变量都已正确配置"
        return 0
    else
        if [ ${#missing_vars[@]} -gt 0 ]; then
            log_error "缺少以下环境变量:"
            printf '  - %s\n' "${missing_vars[@]}"
        fi
        
        if [ ${#weak_vars[@]} -gt 0 ]; then
            log_warning "以下环境变量需要改进:"
            printf '  - %s\n' "${weak_vars[@]}"
        fi
        return 1
    fi
}

# 验证数据库连接
validate_database() {
    log_info "验证数据库连接..."
    
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL 未设置"
        return 1
    fi
    
    # 解析数据库URL
    if [[ "$DATABASE_URL" =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
        local user="${BASH_REMATCH[1]}"
        local host="${BASH_REMATCH[3]}"
        local port="${BASH_REMATCH[4]}"
        local db="${BASH_REMATCH[5]}"
        
        log_info "数据库配置: $user@$host:$port/$db"
        
        # 检查数据库连接（如果pg_isready可用）
        if command -v pg_isready &> /dev/null; then
            if pg_isready -h "$host" -p "$port" -U "$user" &> /dev/null; then
                log_success "数据库连接正常"
            else
                log_warning "无法连接到数据库（可能数据库未启动）"
            fi
        else
            log_info "pg_isready 不可用，跳过数据库连接测试"
        fi
    else
        log_error "DATABASE_URL 格式不正确"
        return 1
    fi
}

# 验证Redis连接
validate_redis() {
    log_info "验证Redis连接..."
    
    if [ -z "$UPSTASH_REDIS_REST_URL" ]; then
        log_error "UPSTASH_REDIS_REST_URL 未设置"
        return 1
    fi
    
    log_info "Redis URL: $UPSTASH_REDIS_REST_URL"
    
    # 如果是本地Redis，尝试连接测试
    if [[ "$UPSTASH_REDIS_REST_URL" == *"localhost"* ]] || [[ "$UPSTASH_REDIS_REST_URL" == *"127.0.0.1"* ]]; then
        if command -v redis-cli &> /dev/null; then
            if redis-cli ping &> /dev/null; then
                log_success "Redis连接正常"
            else
                log_warning "无法连接到Redis（可能Redis未启动）"
            fi
        else
            log_info "redis-cli 不可用，跳过Redis连接测试"
        fi
    else
        log_info "使用远程Redis服务，跳过连接测试"
    fi
}

# 检查可选配置
check_optional_configs() {
    log_info "检查可选配置..."
    
    local optional_vars=(
        "FREESOUND_CLIENT_ID"
        "FREESOUND_API_KEY"
        "CLOUDFLARE_ACCOUNT_ID"
        "R2_ACCESS_KEY_ID"
        "R2_SECRET_ACCESS_KEY"
        "R2_BUCKET_NAME"
        "MODAL_TRANSCRIPTION_URL"
        "AI_EDITING_PLAN_API_URL"
    )
    
    local configured_count=0
    
    for var in "${optional_vars[@]}"; do
        local value="${!var}"
        if [ -n "$value" ] && [[ "$value" != *"your-"* ]] && [[ "$value" != *"placeholder"* ]] && [[ "$value" != *"dummy"* ]]; then
            log_success "$var 已配置"
            ((configured_count++))
        else
            log_info "$var 未配置（可选）"
        fi
    done
    
    log_info "可选配置: $configured_count/${#optional_vars[@]} 个已配置"
}

# 生成配置报告
generate_report() {
    log_info "生成配置报告..."
    
    local report_file="env-validation-report-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "SmartCut Frontend 环境变量验证报告"
        echo "========================="
        echo "生成时间: $(date)"
        echo "NODE_ENV: ${NODE_ENV:-未设置}"
        echo ""
        
        echo "必需环境变量:"
        local required_vars=("DATABASE_URL" "BETTER_AUTH_SECRET" "NEXT_PUBLIC_BETTER_AUTH_URL" "UPSTASH_REDIS_REST_URL" "UPSTASH_REDIS_REST_TOKEN")
        for var in "${required_vars[@]}"; do
            if [ -n "${!var}" ]; then
                echo "  ✅ $var: 已设置"
            else
                echo "  ❌ $var: 未设置"
            fi
        done
        
        echo ""
        echo "可选环境变量:"
        local optional_vars=("FREESOUND_CLIENT_ID" "FREESOUND_API_KEY" "CLOUDFLARE_ACCOUNT_ID" "R2_ACCESS_KEY_ID" "MODAL_TRANSCRIPTION_URL")
        for var in "${optional_vars[@]}"; do
            if [ -n "${!var}" ] && [[ "${!var}" != *"your-"* ]] && [[ "${!var}" != *"placeholder"* ]]; then
                echo "  ✅ $var: 已配置"
            else
                echo "  ⚪ $var: 未配置"
            fi
        done
        
    } > "$report_file"
    
    log_success "配置报告已保存到: $report_file"
}

# 主函数
main() {
    echo "🔍 SmartCut Frontend 环境变量验证工具"
    echo "============================"
    echo
    
    local exit_code=0
    
    # 执行各项检查
    check_env_files
    echo
    
    if ! validate_required_vars; then
        exit_code=1
    fi
    echo
    
    if ! validate_database; then
        exit_code=1
    fi
    echo
    
    if ! validate_redis; then
        exit_code=1
    fi
    echo
    
    check_optional_configs
    echo
    
    # 生成报告
    generate_report
    echo
    
    if [ $exit_code -eq 0 ]; then
        log_success "✅ 环境变量验证通过！"
    else
        log_error "❌ 环境变量验证失败，请检查上述问题"
    fi
    
    exit $exit_code
}

# 执行主函数
main "$@"
