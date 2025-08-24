#!/bin/bash

# SmartCut Frontend 文件整理脚本
# 用于维护项目文件的组织结构

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

# 检查文件组织结构
check_organization() {
    log_info "检查文件组织结构..."
    
    # 检查必要的文件夹
    local required_dirs=(
        "docs"
        "docs/project"
        "docs/development"
        "docs/api"
        "docs/roles"
        "docs/github"
        "docs/transcription"
        "tests"
        "tests/unit"
        "tests/integration"
        "tests/e2e"
        "tests/performance"
        "tests/debug"
        "tests/manual"
        "tests/deployment"
        "deployment"
        "deployment/scripts"
        "deployment/config"
        "deployment/testing"
    )
    
    local missing_dirs=()
    
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            missing_dirs+=("$dir")
        fi
    done
    
    if [ ${#missing_dirs[@]} -gt 0 ]; then
        log_warning "缺少以下目录: ${missing_dirs[*]}"
        return 1
    else
        log_success "文件夹结构检查通过"
        return 0
    fi
}

# 创建缺失的目录
create_missing_dirs() {
    log_info "创建缺失的目录..."
    
    mkdir -p docs/{project,development,api,roles,github,transcription}
    mkdir -p tests/{unit,integration,e2e,performance,debug,manual,deployment}
    mkdir -p tests/unit/{lib,stores}
    mkdir -p tests/e2e/{pages,components}
    mkdir -p tests/integration/{export,api}
    
    log_success "目录创建完成"
}

# 查找错位的文件
find_misplaced_files() {
    log_info "查找可能错位的文件..."
    
    # 查找根目录中的测试文件
    local root_test_files=$(find . -maxdepth 1 -name "*test*" -o -name "*Test*" -o -name "*.test.*" -o -name "*.spec.*" 2>/dev/null | grep -v "./tests" || true)
    
    if [ -n "$root_test_files" ]; then
        log_warning "根目录中发现测试文件:"
        echo "$root_test_files"
    fi
    
    # 查找根目录中的文档文件
    local root_doc_files=$(find . -maxdepth 1 -name "*.md" 2>/dev/null | grep -v "./README.md" | grep -v "./docs" || true)
    
    if [ -n "$root_doc_files" ]; then
        log_warning "根目录中发现文档文件:"
        echo "$root_doc_files"
    fi
    
    # 查找apps目录中的测试文件
    local app_test_files=$(find apps/ -name "*test*" -o -name "*Test*" -o -name "*.test.*" -o -name "*.spec.*" 2>/dev/null || true)
    
    if [ -n "$app_test_files" ]; then
        log_warning "apps目录中发现测试文件:"
        echo "$app_test_files"
    fi
}

# 显示文件组织统计
show_organization_stats() {
    log_info "文件组织统计:"
    
    echo "📚 文档文件:"
    echo "   项目文档: $(find docs/project -name "*.md" 2>/dev/null | wc -l | tr -d ' ')"
    echo "   开发文档: $(find docs/development -name "*.md" 2>/dev/null | wc -l | tr -d ' ')"
    echo "   API文档: $(find docs/api -name "*" -type f 2>/dev/null | wc -l | tr -d ' ')"
    echo "   角色文档: $(find docs/roles -name "*.md" 2>/dev/null | wc -l | tr -d ' ')"
    echo "   GitHub文档: $(find docs/github -name "*.md" 2>/dev/null | wc -l | tr -d ' ')"
    
    echo
    echo "🧪 测试文件:"
    echo "   单元测试: $(find tests/unit -name "*.test.*" -o -name "*.spec.*" 2>/dev/null | wc -l | tr -d ' ')"
    echo "   集成测试: $(find tests/integration -type f 2>/dev/null | wc -l | tr -d ' ')"
    echo "   端到端测试: $(find tests/e2e -type f 2>/dev/null | wc -l | tr -d ' ')"
    echo "   性能测试: $(find tests/performance -type f 2>/dev/null | wc -l | tr -d ' ')"
    echo "   调试脚本: $(find tests/debug -name "*.js" 2>/dev/null | wc -l | tr -d ' ')"
    echo "   手动测试: $(find tests/manual -type f 2>/dev/null | wc -l | tr -d ' ')"
    echo "   部署测试: $(find tests/deployment -name "*.sh" -o -name "*.js" 2>/dev/null | wc -l | tr -d ' ')"
    
    echo
    echo "🚀 部署文件:"
    echo "   部署脚本: $(find deployment/scripts -name "*.sh" 2>/dev/null | wc -l | tr -d ' ')"
    echo "   配置文件: $(find deployment/config -type f 2>/dev/null | wc -l | tr -d ' ')"
}

# 清理空目录
cleanup_empty_dirs() {
    log_info "清理空目录..."
    
    # 清理空的测试目录
    find tests/ -type d -empty -delete 2>/dev/null || true
    find docs/ -type d -empty -delete 2>/dev/null || true
    
    # 清理空的__tests__目录
    find apps/ -name "__tests__" -type d -empty -delete 2>/dev/null || true
    
    log_success "空目录清理完成"
}

# 主函数
main() {
    echo "🗂️  SmartCut Frontend 文件整理工具"
    echo "========================"
    echo
    
    if ! check_organization; then
        log_info "创建缺失的目录结构..."
        create_missing_dirs
    fi
    
    find_misplaced_files
    
    echo
    show_organization_stats
    
    echo
    cleanup_empty_dirs
    
    echo
    log_success "文件整理检查完成！"
    echo
    log_info "📁 主要目录:"
    log_info "   📚 docs/     - 所有文档"
    log_info "   🧪 tests/    - 所有测试"
    log_info "   🚀 deployment/ - 部署配置"
    echo
    log_info "💡 提示:"
    log_info "   - 新的文档文件应放在 docs/ 目录中"
    log_info "   - 新的测试文件应放在 tests/ 目录中"
    log_info "   - 部署相关文件应放在 deployment/ 目录中"
}

# 执行主函数
main "$@"
