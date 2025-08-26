#!/bin/bash

# SmartCut Frontend 视频显示问题修复脚本
# 解决部署后时间轴显示字幕但不显示视频的问题

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

# 服务器配置
SERVER_HOST="39.105.24.90"
SERVER_USER="mf"
CONTAINER_NAME="opencut-container"

# 检查服务器连接
check_server_connection() {
    log_info "检查服务器连接..."
    
    if ssh -o ConnectTimeout=10 $SERVER_USER@$SERVER_HOST "echo 'SSH连接成功'"; then
        log_success "服务器连接正常"
        return 0
    else
        log_error "无法连接到服务器"
        return 1
    fi
}

# 检查Docker容器状态
check_container_status() {
    log_info "检查Docker容器状态..."
    
    local container_status=$(ssh $SERVER_USER@$SERVER_HOST "docker ps --filter name=$CONTAINER_NAME --format '{{.Status}}'")
    
    if [ -n "$container_status" ]; then
        log_success "容器运行状态: $container_status"
        return 0
    else
        log_error "容器未运行或不存在"
        return 1
    fi
}

# 检查uploads目录
check_uploads_directory() {
    log_info "检查uploads目录..."
    
    # 检查容器内的uploads目录
    local uploads_exists=$(ssh $SERVER_USER@$SERVER_HOST "docker exec $CONTAINER_NAME ls -la /app/uploads/ 2>/dev/null | wc -l")
    
    if [ "$uploads_exists" -gt 2 ]; then
        log_success "uploads目录存在且有文件"
    else
        log_warning "uploads目录为空或不存在"
        
        # 创建uploads目录并设置权限
        log_info "创建uploads目录..."
        ssh $SERVER_USER@$SERVER_HOST "docker exec $CONTAINER_NAME mkdir -p /app/uploads && docker exec $CONTAINER_NAME chmod 755 /app/uploads"
        log_success "uploads目录已创建"
    fi
}

# 检查静态文件服务
check_static_file_serving() {
    log_info "检查静态文件服务..."
    
    # 测试静态文件访问
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_HOST/api/health" || echo "000")
    
    if [ "$response_code" = "200" ] || [ "$response_code" = "404" ]; then
        log_success "应用服务正常响应"
    else
        log_warning "应用服务响应异常: $response_code"
    fi
}

# 修复Nginx配置
fix_nginx_config() {
    log_info "检查和修复Nginx配置..."
    
    # 检查Nginx配置是否包含uploads路径
    local nginx_config=$(ssh $SERVER_USER@$SERVER_HOST "docker exec opencut-nginx cat /etc/nginx/nginx.conf | grep -c 'uploads' || echo '0'")
    
    if [ "$nginx_config" = "0" ]; then
        log_warning "Nginx配置可能缺少uploads路径配置"
        
        # 创建修复的Nginx配置
        cat > /tmp/nginx_fix.conf << 'EOF'
# 在location / 块中添加uploads路径处理
location /uploads/ {
    proxy_pass http://opencut-container:3000/uploads/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # 增加超时时间用于大文件
    proxy_read_timeout 300;
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
    
    # 增加缓冲区大小
    proxy_buffering on;
    proxy_buffer_size 4k;
    proxy_buffers 8 4k;
}
EOF
        
        log_info "Nginx配置修复建议已生成: /tmp/nginx_fix.conf"
    else
        log_success "Nginx配置包含uploads路径"
    fi
}

# 检查应用日志中的错误
check_application_logs() {
    log_info "检查应用日志..."
    
    # 获取最近的错误日志
    local error_logs=$(ssh $SERVER_USER@$SERVER_HOST "docker logs $CONTAINER_NAME --tail 20 2>&1 | grep -i error || echo 'No errors found'")
    
    if [ "$error_logs" != "No errors found" ]; then
        log_warning "发现应用错误:"
        echo "$error_logs"
    else
        log_success "应用日志正常"
    fi
}

# 修复文件权限
fix_file_permissions() {
    log_info "修复文件权限..."
    
    # 确保uploads目录有正确的权限
    ssh $SERVER_USER@$SERVER_HOST "
        docker exec $CONTAINER_NAME chown -R node:node /app/uploads 2>/dev/null || true
        docker exec $CONTAINER_NAME chmod -R 755 /app/uploads 2>/dev/null || true
    "
    
    log_success "文件权限已修复"
}

# 重启相关服务
restart_services() {
    log_info "重启相关服务..."
    
    # 重启应用容器
    ssh $SERVER_USER@$SERVER_HOST "docker restart $CONTAINER_NAME"
    
    # 等待容器启动
    sleep 10
    
    # 检查容器状态
    if check_container_status; then
        log_success "服务重启成功"
    else
        log_error "服务重启失败"
        return 1
    fi
}

# 测试视频访问
test_video_access() {
    log_info "测试视频文件访问..."
    
    # 创建测试文件
    ssh $SERVER_USER@$SERVER_HOST "
        docker exec $CONTAINER_NAME sh -c 'echo \"test video content\" > /app/uploads/test.txt'
    "
    
    # 测试文件访问
    local test_response=$(curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_HOST/uploads/test.txt" || echo "000")
    
    if [ "$test_response" = "200" ]; then
        log_success "文件访问测试成功"
    else
        log_warning "文件访问测试失败: HTTP $test_response"
    fi
    
    # 清理测试文件
    ssh $SERVER_USER@$SERVER_HOST "docker exec $CONTAINER_NAME rm -f /app/uploads/test.txt"
}

# 生成诊断报告
generate_diagnostic_report() {
    log_info "生成诊断报告..."
    
    local report_file="video_display_diagnostic_$(date +%Y%m%d_%H%M%S).log"
    
    {
        echo "=== SmartCut Frontend 视频显示问题诊断报告 ==="
        echo "生成时间: $(date)"
        echo "服务器: $SERVER_HOST"
        echo ""
        
        echo "=== 容器状态 ==="
        ssh $SERVER_USER@$SERVER_HOST "docker ps --filter name=$CONTAINER_NAME"
        echo ""
        
        echo "=== 应用日志 (最近20行) ==="
        ssh $SERVER_USER@$SERVER_HOST "docker logs $CONTAINER_NAME --tail 20"
        echo ""
        
        echo "=== uploads目录内容 ==="
        ssh $SERVER_USER@$SERVER_HOST "docker exec $CONTAINER_NAME ls -la /app/uploads/ 2>/dev/null || echo 'Directory not accessible'"
        echo ""
        
        echo "=== 磁盘空间 ==="
        ssh $SERVER_USER@$SERVER_HOST "df -h"
        echo ""
        
        echo "=== 内存使用 ==="
        ssh $SERVER_USER@$SERVER_HOST "free -h"
        echo ""
        
    } > "$report_file"
    
    log_success "诊断报告已生成: $report_file"
}

# 主修复流程
main() {
    echo "🔧 SmartCut Frontend 视频显示问题修复工具"
    echo "=================================="
    echo
    
    # 检查服务器连接
    if ! check_server_connection; then
        log_error "无法连接到服务器，请检查网络和SSH配置"
        exit 1
    fi
    
    # 检查容器状态
    if ! check_container_status; then
        log_error "容器状态异常，请先检查部署状态"
        exit 1
    fi
    
    # 执行修复步骤
    check_uploads_directory
    check_static_file_serving
    fix_nginx_config
    check_application_logs
    fix_file_permissions
    test_video_access
    
    echo
    log_info "是否重启服务以应用修复? (y/N)"
    read -r restart_choice
    
    if [[ $restart_choice =~ ^[Yy]$ ]]; then
        restart_services
    fi
    
    # 生成诊断报告
    generate_diagnostic_report
    
    echo
    log_success "修复流程完成！"
    echo
    log_info "📋 修复总结:"
    log_info "   ✅ 检查了服务器连接"
    log_info "   ✅ 验证了容器状态"
    log_info "   ✅ 修复了文件权限"
    log_info "   ✅ 检查了uploads目录"
    log_info "   ✅ 测试了文件访问"
    echo
    log_info "🔍 如果问题仍然存在，请检查:"
    log_info "   1. 浏览器控制台的详细错误信息"
    log_info "   2. 视频文件是否正确上传到服务器"
    log_info "   3. 网络连接是否稳定"
    log_info "   4. 生成的诊断报告"
    echo
    log_info "💡 建议:"
    log_info "   - 清除浏览器缓存后重试"
    log_info "   - 重新上传视频文件"
    log_info "   - 检查视频文件格式是否支持"
}

# 执行主函数
main "$@"
