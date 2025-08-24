#!/bin/bash

# SmartCut Frontend 数据库初始化脚本
# 用于生产环境的数据库设置和迁移

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

# 检查Docker是否运行
check_docker() {
    if ! docker ps &> /dev/null; then
        log_error "Docker 未运行或无权限访问"
        exit 1
    fi
    log_success "Docker 检查通过"
}

# 等待数据库启动
wait_for_database() {
    log_info "等待数据库启动..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec opencut-postgres pg_isready -U opencut -d opencut &> /dev/null; then
            log_success "数据库已就绪"
            return 0
        fi
        
        log_info "等待数据库启动... ($attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    log_error "数据库启动超时"
    return 1
}

# 创建数据库和用户
setup_database() {
    log_info "设置数据库..."
    
    # 检查数据库是否存在
    if docker exec opencut-postgres psql -U postgres -lqt | cut -d \| -f 1 | grep -qw opencut; then
        log_info "数据库 'opencut' 已存在"
    else
        log_info "创建数据库 'opencut'..."
        docker exec opencut-postgres psql -U postgres -c "CREATE DATABASE opencut;"
    fi
    
    # 检查用户是否存在
    if docker exec opencut-postgres psql -U postgres -t -c "SELECT 1 FROM pg_roles WHERE rolname='opencut'" | grep -q 1; then
        log_info "用户 'opencut' 已存在"
    else
        log_info "创建用户 'opencut'..."
        docker exec opencut-postgres psql -U postgres -c "CREATE USER opencut WITH PASSWORD 'opencutthegoat';"
    fi
    
    # 授予权限
    log_info "设置用户权限..."
    docker exec opencut-postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE opencut TO opencut;"
    docker exec opencut-postgres psql -U postgres -c "ALTER USER opencut CREATEDB;"
    
    log_success "数据库设置完成"
}

# 运行数据库迁移
run_migrations() {
    log_info "运行数据库迁移..."
    
    # 确保在正确的目录
    cd apps/web
    
    # 检查迁移文件是否存在
    if [ ! -d "migrations" ]; then
        log_warning "迁移目录不存在，生成迁移文件..."
        if command -v bun &> /dev/null; then
            bun run db:generate
        else
            npm run db:generate
        fi
    fi
    
    # 运行迁移
    log_info "应用数据库迁移..."
    if command -v bun &> /dev/null; then
        bun run db:push:prod
    else
        npm run db:push:prod
    fi
    
    cd ../..
    log_success "数据库迁移完成"
}

# 验证数据库连接
verify_database() {
    log_info "验证数据库连接..."
    
    # 测试连接
    if docker exec opencut-postgres psql -U opencut -d opencut -c "SELECT version();" &> /dev/null; then
        log_success "数据库连接验证成功"
        
        # 显示数据库信息
        log_info "数据库信息:"
        docker exec opencut-postgres psql -U opencut -d opencut -c "SELECT version();"
        
        # 显示表信息
        log_info "数据库表:"
        docker exec opencut-postgres psql -U opencut -d opencut -c "\dt"
    else
        log_error "数据库连接验证失败"
        return 1
    fi
}

# 创建备份目录
setup_backup() {
    log_info "设置备份目录..."
    
    mkdir -p ./backups
    chmod 755 ./backups
    
    log_success "备份目录设置完成"
}

# 主函数
main() {
    log_info "🗄️ SmartCut Frontend 数据库初始化开始"
    
    # 检查Docker
    check_docker
    
    # 等待数据库启动
    wait_for_database
    
    # 设置数据库
    setup_database
    
    # 运行迁移
    run_migrations
    
    # 验证数据库
    verify_database
    
    # 设置备份
    setup_backup
    
    log_success "🎉 数据库初始化完成！"
    log_info "数据库连接字符串: postgresql://opencut:opencutthegoat@localhost:5432/opencut"
}

# 错误处理
trap 'log_error "数据库初始化过程中发生错误！"' ERR

# 执行主函数
main "$@"
