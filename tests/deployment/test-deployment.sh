#!/bin/bash

# SmartCut Frontend 部署测试脚本
# 验证部署是否成功，应用是否正常运行

set -e

# 配置变量
SERVER_HOST="39.105.24.90"
SERVER_USER="mf"
APP_URL="http://$SERVER_HOST"
HEALTH_ENDPOINT="$APP_URL/api/health"

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

# 测试服务器连接
test_server_connection() {
    log_info "测试服务器连接..."
    
    if ssh -o ConnectTimeout=10 $SERVER_USER@$SERVER_HOST "echo 'SSH连接成功'" &> /dev/null; then
        log_success "SSH连接正常"
        return 0
    else
        log_error "SSH连接失败"
        return 1
    fi
}

# 测试Docker容器状态
test_docker_containers() {
    log_info "检查Docker容器状态..."
    
    ssh $SERVER_USER@$SERVER_HOST << 'EOF'
        cd /home/mf/opencut
        
        echo "🐳 Docker容器状态:"
        if command -v docker-compose &> /dev/null; then
            COMPOSE_CMD="docker-compose"
        else
            COMPOSE_CMD="sudo docker-compose"
        fi
        
        # 检查容器状态
        $COMPOSE_CMD -f docker-compose.prod.yml ps
        
        echo
        echo "📊 容器健康状态:"
        
        # 检查各个服务
        services=("opencut-app" "opencut-postgres" "opencut-redis" "opencut-nginx")
        
        for service in "${services[@]}"; do
            if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$service"; then
                status=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep "$service" | awk '{print $2}')
                if [[ "$status" == "Up"* ]]; then
                    echo "✅ $service: 运行正常"
                else
                    echo "⚠️  $service: $status"
                fi
            else
                echo "❌ $service: 未运行"
            fi
        done
EOF
}

# 测试应用健康检查
test_app_health() {
    log_info "测试应用健康检查..."
    
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "尝试连接应用... ($attempt/$max_attempts)"
        
        if curl -f -s --connect-timeout 10 "$HEALTH_ENDPOINT" > /dev/null; then
            log_success "应用健康检查通过"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    log_error "应用健康检查失败"
    return 1
}

# 测试网页访问
test_web_access() {
    log_info "测试网页访问..."
    
    # 测试主页
    if curl -f -s --connect-timeout 10 "$APP_URL" > /dev/null; then
        log_success "主页访问正常"
    else
        log_error "主页访问失败"
        return 1
    fi
    
    # 测试API端点
    local api_endpoints=(
        "/api/health"
    )
    
    for endpoint in "${api_endpoints[@]}"; do
        if curl -f -s --connect-timeout 10 "$APP_URL$endpoint" > /dev/null; then
            log_success "API端点 $endpoint 正常"
        else
            log_warning "API端点 $endpoint 可能有问题"
        fi
    done
}

# 测试数据库连接
test_database_connection() {
    log_info "测试数据库连接..."
    
    ssh $SERVER_USER@$SERVER_HOST << 'EOF'
        cd /home/mf/opencut
        
        echo "🗄️ 数据库连接测试:"
        
        # 测试PostgreSQL连接
        if docker exec opencut-postgres psql -U opencut -d opencut -c "SELECT version();" &> /dev/null; then
            echo "✅ PostgreSQL 连接正常"
            
            # 显示数据库信息
            echo "数据库版本:"
            docker exec opencut-postgres psql -U opencut -d opencut -c "SELECT version();" | head -3
            
            echo "数据库表:"
            docker exec opencut-postgres psql -U opencut -d opencut -c "\dt" | head -10
        else
            echo "❌ PostgreSQL 连接失败"
        fi
        
        echo
        echo "📦 Redis连接测试:"
        
        # 测试Redis连接
        if docker exec opencut-redis redis-cli ping | grep -q "PONG"; then
            echo "✅ Redis 连接正常"
            echo "Redis信息:"
            docker exec opencut-redis redis-cli info server | grep "redis_version"
        else
            echo "❌ Redis 连接失败"
        fi
EOF
}

# 性能测试
test_performance() {
    log_info "执行基础性能测试..."
    
    # 测试响应时间
    log_info "测试响应时间..."
    local response_time=$(curl -o /dev/null -s -w '%{time_total}' "$APP_URL")
    
    if (( $(echo "$response_time < 5.0" | bc -l) )); then
        log_success "响应时间正常: ${response_time}s"
    else
        log_warning "响应时间较慢: ${response_time}s"
    fi
    
    # 测试并发请求
    log_info "测试并发请求处理..."
    if command -v ab &> /dev/null; then
        ab -n 10 -c 2 "$APP_URL/" > /tmp/ab_test.log 2>&1
        
        local requests_per_second=$(grep "Requests per second" /tmp/ab_test.log | awk '{print $4}')
        if [ ! -z "$requests_per_second" ]; then
            log_success "并发处理能力: $requests_per_second requests/sec"
        fi
        
        rm -f /tmp/ab_test.log
    else
        log_warning "Apache Bench (ab) 未安装，跳过并发测试"
    fi
}

# 检查日志
check_logs() {
    log_info "检查应用日志..."
    
    ssh $SERVER_USER@$SERVER_HOST << 'EOF'
        cd /home/mf/opencut
        
        echo "📋 最近的应用日志:"
        
        if command -v docker-compose &> /dev/null; then
            COMPOSE_CMD="docker-compose"
        else
            COMPOSE_CMD="sudo docker-compose"
        fi
        
        # 显示各服务的日志
        echo "SmartCut Frontend应用日志:"
        $COMPOSE_CMD -f docker-compose.prod.yml logs --tail 10 opencut-app 2>/dev/null || echo "无法获取应用日志"
        
        echo
        echo "Nginx日志:"
        $COMPOSE_CMD -f docker-compose.prod.yml logs --tail 5 nginx 2>/dev/null || echo "无法获取Nginx日志"
        
        echo
        echo "PostgreSQL日志:"
        $COMPOSE_CMD -f docker-compose.prod.yml logs --tail 5 postgres 2>/dev/null || echo "无法获取数据库日志"
EOF
}

# 生成测试报告
generate_report() {
    log_info "生成测试报告..."
    
    local report_file="deployment-test-report-$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
SmartCut Frontend 部署测试报告
==================

测试时间: $(date)
服务器: $SERVER_HOST
应用URL: $APP_URL

测试结果:
- 服务器连接: $(test_server_connection && echo "✅ 通过" || echo "❌ 失败")
- 应用健康检查: $(test_app_health && echo "✅ 通过" || echo "❌ 失败")
- 网页访问: $(test_web_access && echo "✅ 通过" || echo "❌ 失败")

建议:
1. 定期监控应用性能和日志
2. 设置自动备份策略
3. 配置SSL证书以启用HTTPS
4. 设置监控告警

EOF
    
    log_success "测试报告已生成: $report_file"
}

# 主函数
main() {
    log_info "🧪 SmartCut Frontend 部署测试开始"
    echo "服务器: $SERVER_HOST"
    echo "应用URL: $APP_URL"
    echo
    
    local test_passed=0
    local test_total=0
    
    # 执行各项测试
    tests=(
        "test_server_connection"
        "test_docker_containers"
        "test_app_health"
        "test_web_access"
        "test_database_connection"
        "test_performance"
    )
    
    for test in "${tests[@]}"; do
        ((test_total++))
        if $test; then
            ((test_passed++))
        fi
        echo
    done
    
    # 检查日志
    check_logs
    
    # 生成报告
    generate_report
    
    # 显示测试结果
    log_info "测试完成: $test_passed/$test_total 项通过"
    
    if [ $test_passed -eq $test_total ]; then
        log_success "🎉 所有测试通过！部署成功！"
        log_info "应用访问地址: $APP_URL"
    else
        log_warning "⚠️  部分测试失败，请检查日志并修复问题"
    fi
}

# 执行主函数
main "$@"
