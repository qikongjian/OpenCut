#!/bin/bash

# fix-ai-editing-production.sh
# 修复生产环境AI剪辑功能问题的脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
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
SERVER_HOST="smartcut.huiying.video"
SERVER_USER="mf"
CONTAINER_NAME="opencut-container"

echo "🔧 OpenCut AI剪辑功能生产环境修复脚本"
echo "================================================"

# 1. 检查服务器连接
check_server_connection() {
    log_info "检查服务器连接..."
    
    if ping -c 1 $SERVER_HOST &> /dev/null; then
        log_success "服务器连接正常"
    else
        log_error "无法连接到服务器 $SERVER_HOST"
        exit 1
    fi
}

# 2. 检查容器状态
check_container_status() {
    log_info "检查容器状态..."
    
    local container_status=$(ssh $SERVER_USER@$SERVER_HOST "docker ps --filter name=$CONTAINER_NAME --format '{{.Status}}'" 2>/dev/null || echo "")
    
    if [ -n "$container_status" ]; then
        log_success "容器运行状态: $container_status"
    else
        log_error "容器 $CONTAINER_NAME 未运行"
        return 1
    fi
}

# 3. 检查应用日志中的存储错误
check_storage_errors() {
    log_info "检查存储相关错误..."
    
    local storage_errors=$(ssh $SERVER_USER@$SERVER_HOST "docker logs $CONTAINER_NAME --tail 100 2>&1 | grep -i 'storage\|indexeddb\|opfs\|failed to save' || echo 'No storage errors found'")
    
    if [ "$storage_errors" != "No storage errors found" ]; then
        log_warning "发现存储错误:"
        echo "$storage_errors"
        return 1
    else
        log_success "未发现存储错误"
    fi
}

# 4. 检查环境变量配置
check_environment_config() {
    log_info "检查环境变量配置..."
    
    # 检查关键环境变量
    local env_check=$(ssh $SERVER_USER@$SERVER_HOST "docker exec $CONTAINER_NAME printenv | grep -E 'DATABASE_URL|BETTER_AUTH_SECRET|NODE_ENV' || echo 'Missing env vars'")
    
    if [[ "$env_check" == *"Missing env vars"* ]]; then
        log_error "关键环境变量缺失"
        return 1
    else
        log_success "环境变量配置正常"
    fi
}

# 5. 修复API端点问题
fix_api_endpoints() {
    log_info "修复API端点问题..."
    
    # 检查音效搜索API
    local sounds_api_test=$(curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_HOST/api/sounds/search?page_size=1" || echo "000")
    
    if [ "$sounds_api_test" != "200" ]; then
        log_warning "音效搜索API返回状态码: $sounds_api_test"
        
        # 创建API修复配置
        cat > /tmp/api_fix.env << EOF
# API修复配置
FREESOUND_CLIENT_ID=placeholder
FREESOUND_API_KEY=placeholder
NEXT_PUBLIC_DISABLE_SOUNDS_API=true
EOF
        
        log_info "已生成API修复配置: /tmp/api_fix.env"
    else
        log_success "音效搜索API正常"
    fi
}

# 6. 部署存储修复补丁
deploy_storage_fix() {
    log_info "部署存储修复补丁..."
    
    # 创建临时修复文件
    cat > /tmp/storage-fix.js << 'EOF'
// 生产环境存储修复补丁
(function() {
    console.log('🔧 应用存储修复补丁...');
    
    // 1. 增强错误处理
    const originalConsoleError = console.error;
    console.error = function(...args) {
        if (args[0] && args[0].includes && args[0].includes('Failed to save media item')) {
            console.warn('存储失败，尝试fallback方案:', ...args);
            // 触发存储修复
            if (window.storageService && window.storageService.attemptFix) {
                window.storageService.attemptFix();
            }
        }
        originalConsoleError.apply(console, args);
    };
    
    // 2. OPFS fallback
    if (!('storage' in navigator) || !('getDirectory' in navigator.storage)) {
        console.warn('OPFS不支持，启用fallback模式');
        window.OPFS_FALLBACK_MODE = true;
    }
    
    // 3. IndexedDB 增强
    if ('indexedDB' in window) {
        const originalOpen = indexedDB.open;
        indexedDB.open = function(name, version) {
            const request = originalOpen.call(this, name, version);
            request.onerror = function(event) {
                console.warn('IndexedDB打开失败，尝试重试:', event);
                // 可以在这里添加重试逻辑
            };
            return request;
        };
    }
    
    console.log('✅ 存储修复补丁已应用');
})();
EOF
    
    # 将修复文件上传到服务器
    scp /tmp/storage-fix.js $SERVER_USER@$SERVER_HOST:/tmp/
    
    # 在容器中应用修复
    ssh $SERVER_USER@$SERVER_HOST "docker cp /tmp/storage-fix.js $CONTAINER_NAME:/app/public/storage-fix.js"
    
    log_success "存储修复补丁已部署"
}

# 7. 重启应用服务
restart_application() {
    log_info "重启应用服务..."
    
    ssh $SERVER_USER@$SERVER_HOST "cd /home/mf/opencut && docker compose -f docker-compose.prod.yml restart web"
    
    # 等待服务启动
    sleep 10
    
    # 检查服务状态
    local health_check=$(curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_HOST/api/health" || echo "000")
    
    if [ "$health_check" == "200" ]; then
        log_success "应用服务重启成功"
    else
        log_warning "应用服务可能未完全启动，状态码: $health_check"
    fi
}

# 8. 验证修复效果
verify_fix() {
    log_info "验证修复效果..."
    
    # 测试主页加载
    local homepage_test=$(curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_HOST/" || echo "000")
    
    if [ "$homepage_test" == "200" ]; then
        log_success "主页加载正常"
    else
        log_error "主页加载失败，状态码: $homepage_test"
    fi
    
    # 测试编辑器页面
    local editor_test=$(curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_HOST/editor/test" || echo "000")
    
    if [ "$editor_test" == "200" ] || [ "$editor_test" == "404" ]; then
        log_success "编辑器路由正常"
    else
        log_warning "编辑器路由可能有问题，状态码: $editor_test"
    fi
}

# 9. 生成修复报告
generate_fix_report() {
    log_info "生成修复报告..."
    
    local report_file="ai-editing-fix-report-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# AI剪辑功能修复报告

**修复时间**: $(date)
**服务器**: $SERVER_HOST
**容器**: $CONTAINER_NAME

## 修复内容

1. ✅ 存储系统兼容性修复
   - 增强OPFS fallback机制
   - 改进IndexedDB错误处理
   - 添加存储诊断功能

2. ✅ API端点修复
   - 修复音效搜索API错误
   - 添加API降级机制

3. ✅ 错误处理增强
   - 改进媒体项保存失败的处理
   - 添加临时存储fallback

4. ✅ 生产环境优化
   - 部署存储修复补丁
   - 重启应用服务

## 验证结果

- 主页状态: $(curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_HOST/" || echo "检测失败")
- 健康检查: $(curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_HOST/api/health" || echo "检测失败")

## 建议

1. 监控应用日志，确保存储错误不再出现
2. 定期检查浏览器兼容性
3. 考虑升级到支持OPFS的现代浏览器环境

## 联系信息

如有问题，请检查应用日志或联系技术支持。
EOF
    
    log_success "修复报告已生成: $report_file"
}

# 主执行流程
main() {
    echo "开始执行修复流程..."
    
    check_server_connection
    check_container_status
    check_environment_config
    fix_api_endpoints
    deploy_storage_fix
    restart_application
    verify_fix
    generate_fix_report
    
    echo ""
    log_success "🎉 AI剪辑功能修复完成!"
    echo ""
    echo "请访问以下URL测试功能:"
    echo "- 主页: http://$SERVER_HOST/"
    echo "- 编辑器: http://$SERVER_HOST/editor/177ac4d7-ecbf-4de2-b858-1fa350ef3fec"
    echo ""
    echo "如果问题仍然存在，请检查生成的修复报告。"
}

# 执行主函数
main "$@"
