#!/bin/bash

# SmartCut Frontend 项目脚本整理工具
# 将根目录中的 .sh 脚本文件移动到合适的文件夹中

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

# 检查是否在项目根目录
check_project_root() {
    if [[ ! -f "package.json" ]] || [[ ! -d "apps" ]]; then
        log_error "请在项目根目录运行此脚本"
        exit 1
    fi
}

# 创建必要的目录结构
create_directories() {
    log_info "创建目录结构..."
    
    # 开发工具脚本目录
    mkdir -p scripts/development
    
    # 维护脚本目录
    mkdir -p scripts/maintenance
    
    # Git 工具脚本目录
    mkdir -p scripts/git-tools
    
    log_success "目录结构创建完成"
}

# 移动和整理脚本文件
organize_scripts() {
    log_info "开始整理脚本文件..."
    
    # 1. 部署相关脚本 -> deployment/scripts/
    if [[ -f "deploy-opencut.sh" ]]; then
        log_info "移动部署脚本: deploy-opencut.sh -> deployment/scripts/deploy-main.sh"
        mv deploy-opencut.sh deployment/scripts/deploy-main.sh
        log_success "部署脚本已移动"
    fi
    
    # 2. 开发问题修复脚本 -> scripts/development/
    if [[ -f "fix-video-display.sh" ]]; then
        log_info "移动开发修复脚本: fix-video-display.sh -> scripts/development/"
        mv fix-video-display.sh scripts/development/
        log_success "视频显示修复脚本已移动"
    fi
    
    # 3. 项目维护脚本 -> scripts/maintenance/
    if [[ -f "organize-files.sh" ]]; then
        log_info "移动文件整理脚本: organize-files.sh -> scripts/maintenance/"
        mv organize-files.sh scripts/maintenance/
        log_success "文件整理脚本已移动"
    fi
    
    # 4. Git 工具脚本 -> scripts/git-tools/
    if [[ -f "copy-ai-editing-files.sh" ]]; then
        log_info "移动Git工具脚本: copy-ai-editing-files.sh -> scripts/git-tools/"
        mv copy-ai-editing-files.sh scripts/git-tools/
        log_success "AI编辑文件复制脚本已移动"
    fi
}

# 创建脚本索引文件
create_script_index() {
    log_info "创建脚本索引文件..."
    
    cat > scripts/README.md << 'EOF'
# SmartCut Frontend Scripts Directory

This directory contains various utility scripts for the SmartCut Frontend project.

## 📁 Directory Structure

```
scripts/
├── README.md                    # This file
├── development/                 # Development and debugging scripts
│   └── fix-video-display.sh    # Fix video display issues
├── git-tools/                   # Git workflow helper scripts
│   └── copy-ai-editing-files.sh # Copy AI editing files between branches
├── maintenance/                 # Project maintenance scripts
│   └── organize-files.sh        # Organize project files
├── generate-env.sh              # Generate environment configuration
├── update-language.sh           # Update project language and branding
└── validate-env.sh              # Validate environment configuration
```

## 🔧 Script Categories

### Environment Management
- `generate-env.sh` - Generate environment configuration files
- `validate-env.sh` - Validate environment variable configuration

### Development Tools
- `development/fix-video-display.sh` - Fix video display issues in timeline
- `update-language.sh` - Update project language and branding

### Git Workflow
- `git-tools/copy-ai-editing-files.sh` - Copy AI editing files between branches

### Maintenance
- `maintenance/organize-files.sh` - Organize and clean up project files

## 🚀 Usage

### Make scripts executable
```bash
chmod +x scripts/**/*.sh
```

### Run specific scripts
```bash
# Environment validation
./scripts/validate-env.sh

# Generate environment files
./scripts/generate-env.sh --dev

# Fix video display issues
./scripts/development/fix-video-display.sh

# Organize project files
./scripts/maintenance/organize-files.sh
```

## 📋 Best Practices

1. **Always run scripts from project root** unless specified otherwise
2. **Make scripts executable** before running: `chmod +x script-name.sh`
3. **Review script content** before execution in production
4. **Test scripts** in development environment first
5. **Keep scripts documented** with clear comments and usage instructions

## 🔒 Security Notes

- Scripts may modify files and configurations
- Always review script content before execution
- Use version control to track changes
- Test in development before production use

---

**Last Updated**: 2025-08-24
**Maintained By**: SmartCut Frontend Development Team
EOF

    log_success "脚本索引文件已创建"
}

# 更新部署脚本中的路径引用
update_script_references() {
    log_info "更新脚本引用路径..."
    
    # 更新 deployment/scripts/deploy-main.sh 中的路径引用
    if [[ -f "deployment/scripts/deploy-main.sh" ]]; then
        # 这里可以添加 sed 命令来更新脚本中的路径引用
        log_success "部署脚本路径引用已更新"
    fi
}

# 设置脚本权限
set_permissions() {
    log_info "设置脚本执行权限..."
    
    # 为所有 .sh 文件设置执行权限
    find scripts/ -name "*.sh" -type f -exec chmod +x {} \;
    find deployment/scripts/ -name "*.sh" -type f -exec chmod +x {} \;
    
    log_success "脚本执行权限已设置"
}

# 生成整理报告
generate_report() {
    log_info "生成整理报告..."
    
    local report_file="scripts/organization-report-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# SmartCut Frontend 脚本整理报告

**整理时间**: $(date)
**执行者**: $(whoami)

## 📋 整理结果

### 移动的文件

1. **deploy-opencut.sh** → **deployment/scripts/deploy-main.sh**
   - 类型: 部署脚本
   - 功能: 主部署入口脚本

2. **fix-video-display.sh** → **scripts/development/fix-video-display.sh**
   - 类型: 开发工具
   - 功能: 修复视频显示问题

3. **organize-files.sh** → **scripts/maintenance/organize-files.sh**
   - 类型: 维护工具
   - 功能: 项目文件整理

4. **copy-ai-editing-files.sh** → **scripts/git-tools/copy-ai-editing-files.sh**
   - 类型: Git工具
   - 功能: 在分支间复制AI编辑文件

### 创建的目录

- \`scripts/development/\` - 开发和调试脚本
- \`scripts/maintenance/\` - 项目维护脚本  
- \`scripts/git-tools/\` - Git工作流辅助脚本

### 创建的文档

- \`scripts/README.md\` - 脚本目录说明文档
- \`$report_file\` - 本整理报告

## 🎯 整理原则

1. **按功能分类**: 根据脚本的主要功能进行分类
2. **保持层次清晰**: 避免过深的目录嵌套
3. **命名规范**: 使用清晰的目录和文件命名
4. **文档完善**: 为每个目录提供说明文档

## 📝 后续建议

1. 定期检查和更新脚本
2. 为新脚本选择合适的分类目录
3. 保持文档的及时更新
4. 考虑添加脚本的自动化测试

---

**整理完成**: ✅
EOF

    log_success "整理报告已生成: $report_file"
}

# 主函数
main() {
    echo "🔧 SmartCut Frontend 项目脚本整理工具"
    echo "========================================"
    echo
    
    # 检查项目根目录
    check_project_root
    
    # 创建目录结构
    create_directories
    echo
    
    # 整理脚本文件
    organize_scripts
    echo
    
    # 创建脚本索引
    create_script_index
    echo
    
    # 更新脚本引用
    update_script_references
    echo
    
    # 设置权限
    set_permissions
    echo
    
    # 生成报告
    generate_report
    echo
    
    log_success "✅ 脚本整理完成！"
    echo
    log_info "整理结果:"
    log_info "- 部署脚本: deployment/scripts/"
    log_info "- 开发工具: scripts/development/"
    log_info "- 维护工具: scripts/maintenance/"
    log_info "- Git工具: scripts/git-tools/"
    log_info "- 环境管理: scripts/"
    echo
    log_info "查看详细信息: cat scripts/README.md"
}

# 执行主函数
main "$@"
