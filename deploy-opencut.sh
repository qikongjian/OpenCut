#!/bin/bash

# SmartCut Frontend 主部署脚本
# 从项目根目录调用部署脚本的便捷入口

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

# 检查部署文件夹是否存在
if [ ! -d "deployment" ]; then
    log_error "部署文件夹不存在！请确保在项目根目录运行此脚本。"
    exit 1
fi

# 显示菜单
show_menu() {
    echo
    echo "🚀 SmartCut Frontend 部署工具"
    echo "===================="
    echo
    echo "请选择部署方式："
    echo "1) 快速部署 (推荐)"
    echo "2) TAR包部署"
    echo "3) 标准部署"
    echo "4) 仅前端部署"
    echo "5) 服务器环境检查"
    echo "6) 部署测试"
    echo "7) 查看部署文档"
    echo "0) 退出"
    echo
}

# 执行部署
execute_deployment() {
    case $1 in
        1)
            log_info "执行快速部署..."
            cd deployment/scripts
            chmod +x quick-deploy.sh
            ./quick-deploy.sh
            ;;
        2)
            log_info "执行TAR包部署..."
            cd deployment/scripts
            chmod +x deploy-tar.sh
            ./deploy-tar.sh
            ;;
        3)
            log_info "执行标准部署..."
            cd deployment/scripts
            chmod +x deploy.sh
            ./deploy.sh
            ;;
        4)
            log_info "执行仅前端部署..."
            cd deployment/scripts
            chmod +x deploy-frontend-only.sh
            ./deploy-frontend-only.sh
            ;;
        5)
            log_info "检查服务器环境..."
            cd deployment/testing
            chmod +x check-server-env.sh
            ./check-server-env.sh
            ;;
        6)
            log_info "运行部署测试..."
            cd deployment/testing
            chmod +x test-deployment.sh
            ./test-deployment.sh
            ;;
        7)
            log_info "打开部署文档..."
            if command -v open &> /dev/null; then
                open deployment/docs/部署说明.md
            elif command -v xdg-open &> /dev/null; then
                xdg-open deployment/docs/部署说明.md
            else
                log_info "请查看文件: deployment/docs/部署说明.md"
            fi
            ;;
        0)
            log_info "退出部署工具"
            exit 0
            ;;
        *)
            log_error "无效选择，请重新选择"
            return 1
            ;;
    esac
}

# 主函数
main() {
    log_info "SmartCut Frontend 部署工具启动"
    
    # 检查必要工具
    if ! command -v ssh &> /dev/null; then
        log_error "SSH 未安装，请先安装 SSH 客户端"
        exit 1
    fi
    
    while true; do
        show_menu
        read -p "请输入选择 (0-7): " choice
        
        if execute_deployment $choice; then
            if [ "$choice" != "0" ] && [ "$choice" != "7" ]; then
                log_success "操作完成！"
                echo
                read -p "按回车键继续..."
            fi
        fi
    done
}

# 如果直接传入参数，直接执行
if [ $# -gt 0 ]; then
    execute_deployment $1
else
    main
fi
