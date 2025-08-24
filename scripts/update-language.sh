#!/bin/bash

# SmartCut Frontend Language Update Script
# Updates Chinese text to English throughout the project

set -e

# Colors for output
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

# Function to replace text in files
replace_text() {
    local search_text="$1"
    local replace_text="$2"
    local file_pattern="$3"
    
    log_info "Replacing '$search_text' with '$replace_text' in $file_pattern files..."
    
    # Find and replace in specified file types
    find . -name "$file_pattern" -type f -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.next/*" | \
    xargs grep -l "$search_text" 2>/dev/null | \
    while read -r file; do
        if [[ -f "$file" ]]; then
            sed -i.bak "s/$search_text/$replace_text/g" "$file" && rm "$file.bak"
            log_success "Updated: $file"
        fi
    done
}

# Function to replace Chinese text patterns
replace_chinese_patterns() {
    log_info "Starting Chinese to English text replacement..."
    
    # Common UI text replacements
    replace_text "正在生成" "Generating" "*.tsx"
    replace_text "生成AI剪辑计划" "Generate AI Editing Plan" "*.tsx"
    replace_text "生成Mock数据" "Generate Mock Data" "*.tsx"
    replace_text "一键剪辑" "One-Click Edit" "*.tsx"
    replace_text "重新生成" "Regenerate" "*.tsx"
    replace_text "执行中" "Executing" "*.tsx"
    replace_text "执行进度" "Execution Progress" "*.tsx"
    replace_text "片段列表" "Clip List" "*.tsx"
    replace_text "片段" "Clip" "*.tsx"
    replace_text "预览" "Preview" "*.tsx"
    replace_text "停止" "Stop" "*.tsx"
    replace_text "导出" "Export" "*.tsx"
    replace_text "上传" "Upload" "*.tsx"
    replace_text "删除" "Delete" "*.tsx"
    replace_text "编辑" "Edit" "*.tsx"
    replace_text "保存" "Save" "*.tsx"
    replace_text "取消" "Cancel" "*.tsx"
    replace_text "确认" "Confirm" "*.tsx"
    replace_text "设置" "Settings" "*.tsx"
    replace_text "帮助" "Help" "*.tsx"
    replace_text "关于" "About" "*.tsx"
    
    # Error and success messages
    replace_text "请先创建或打开一个项目" "Please create or open a project first" "*.tsx"
    replace_text "请先生成AI剪辑计划" "Please generate AI editing plan first" "*.tsx"
    replace_text "显示原视频失败" "Failed to show original video" "*.tsx"
    replace_text "执行剪辑失败" "Failed to execute editing" "*.tsx"
    replace_text "请重试" "please try again" "*.tsx"
    replace_text "已定位到源视频" "Located source video" "*.tsx"
    replace_text "未找到源视频文件" "Source video file not found" "*.tsx"
    replace_text "请先上传视频文件到媒体库" "Please upload video files to media library first" "*.tsx"
    
    # Feature descriptions
    replace_text "AI智能剪辑计划" "AI Smart Editing Plan" "*.tsx"
    replace_text "让AI分析您的视频素材" "Let AI analyze your video materials" "*.tsx"
    replace_text "自动生成专业的剪辑方案" "automatically generate professional editing plans" "*.tsx"
    replace_text "包含精确的时间轴" "including precise timelines" "*.tsx"
    replace_text "转场效果和音效建议" "transition effects and sound effect suggestions" "*.tsx"
    replace_text "智能片段识别" "Smart Clip Detection" "*.tsx"
    replace_text "精确时间轴" "Precise Timeline" "*.tsx"
    replace_text "转场建议" "Transition Suggestions" "*.tsx"
    replace_text "媒体文件" "Media Files" "*.tsx"
    replace_text "个文件" "files" "*.tsx"
    replace_text "个片段" "clips" "*.tsx"
    
    # Comments and documentation
    replace_text "AI剪辑面板组件" "AI Editing Panel Component" "*.tsx"
    replace_text "现代化重新设计" "Modern Redesign" "*.tsx"
    replace_text "高级UI设计师重新设计" "Redesigned by senior UI designer" "*.tsx"
    replace_text "完美融合到系统中" "perfectly integrated into the system" "*.tsx"
    replace_text "最后更新" "Last updated" "*.tsx"
    replace_text "获取URL参数中的项目ID" "Get project ID from URL parameters" "*.tsx"
    replace_text "获取项目ID" "Get project ID" "*.tsx"
    replace_text "优先使用URL中的ID" "prioritize URL ID" "*.tsx"
    replace_text "然后是activeProject的ID" "then activeProject ID" "*.tsx"
    replace_text "使用URL中的项目ID" "Using project ID from URL" "*.tsx"
    replace_text "使用activeProject的ID" "Using activeProject ID" "*.tsx"
    replace_text "没有找到有效的项目ID" "No valid project ID found" "*.tsx"
    replace_text "生成AI剪辑计划（真实API调用）" "Generate AI editing plan (real API call)" "*.tsx"
    replace_text "开始生成AI剪辑计划" "Starting AI editing plan generation" "*.tsx"
    replace_text "项目ID" "project ID" "*.tsx"
    replace_text "生成Mock数据（保留作为备用）" "Generate mock data (kept as backup)" "*.tsx"
    replace_text "显示原始视频" "Show original video" "*.tsx"
    replace_text "显示原视频失败" "Failed to show original video" "*.tsx"
    replace_text "执行剪辑" "Execute editing" "*.tsx"
    replace_text "预览片段" "Preview clip" "*.tsx"
    replace_text "定位源视频" "Locate source video" "*.tsx"
    replace_text "视频预览" "Video preview" "*.tsx"
    replace_text "格式化时间码" "Format timecode" "*.tsx"
    replace_text "时间码转秒数" "Convert timecode to seconds" "*.tsx"
    
    log_success "Chinese to English text replacement completed!"
}

# Function to update project name references
update_project_name() {
    log_info "Updating project name from SmartCut Frontend to SmartCut Frontend..."
    
    # Update in various file types
    replace_text "SmartCut Frontend" "SmartCut Frontend" "*.md"
    replace_text "SmartCut Frontend" "SmartCut Frontend" "*.json"
    replace_text "SmartCut Frontend" "SmartCut Frontend" "*.yml"
    replace_text "SmartCut Frontend" "SmartCut Frontend" "*.yaml"
    replace_text "SmartCut Frontend" "SmartCut Frontend" "*.sh"
    replace_text "SmartCut Frontend" "SmartCut Frontend" "*.tsx"
    replace_text "SmartCut Frontend" "SmartCut Frontend" "*.ts"
    
    # Update package names (lowercase with hyphens)
    replace_text '"name": "opencut"' '"name": "smartcut-frontend"' "*.json"
    
    log_success "Project name update completed!"
}

# Function to update database and container names
update_service_names() {
    log_info "Updating service and database names..."
    
    # Update database names in environment files
    find . -name "*.env*" -type f -not -path "./node_modules/*" | \
    while read -r file; do
        if [[ -f "$file" ]]; then
            # Update database name in connection strings
            sed -i.bak 's/opencut:/smartcut:/g' "$file" && rm "$file.bak"
            sed -i.bak 's/\/opencut"/\/smartcut"/g' "$file" && rm "$file.bak"
            log_success "Updated database names in: $file"
        fi
    done
    
    # Update container names in docker files
    find . -name "docker-compose*.yml" -type f | \
    while read -r file; do
        if [[ -f "$file" ]]; then
            sed -i.bak 's/opencut-/smartcut-/g' "$file" && rm "$file.bak"
            log_success "Updated container names in: $file"
        fi
    done
    
    log_success "Service and database name update completed!"
}

# Main execution
main() {
    echo "🔄 SmartCut Frontend Language Update Tool"
    echo "=========================================="
    echo
    
    log_info "Starting language and project name updates..."
    echo
    
    # Update project name references
    update_project_name
    echo
    
    # Replace Chinese text with English
    replace_chinese_patterns
    echo
    
    # Update service names
    update_service_names
    echo
    
    log_success "✅ All updates completed successfully!"
    echo
    log_info "Next steps:"
    log_info "1. Review the changes with 'git diff'"
    log_info "2. Test the application to ensure everything works"
    log_info "3. Update any remaining manual translations as needed"
    log_info "4. Commit the changes when satisfied"
}

# Execute main function
main "$@"
