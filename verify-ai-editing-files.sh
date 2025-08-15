#!/bin/bash

echo "🔍 验证一键剪辑功能文件完整性..."

# 检查核心文件是否存在
echo "📁 检查核心文件..."

core_files=(
    "apps/web/src/stores/ai-editing-store.ts"
    "apps/web/src/components/editor/ai-editing-panel.tsx"
    "apps/web/src/lib/ai-editing-mock-data.ts"
    "apps/web/src/lib/ai-subtitle-integration.ts"
    "apps/web/src/lib/subtitle-parser.ts"
    "apps/web/src/stores/video-preview-store.ts"
    "apps/web/src/components/editor/video-thumbnail.tsx"
    "apps/web/src/types/timeline.ts"
    "apps/web/src/components/editor/media-panel/store.ts"
    "apps/web/src/components/editor/media-panel/index.tsx"
    "apps/web/src/lib/subtitle-integration-verification.ts"
    "apps/web/src/lib/__tests__/subtitle-integration.test.ts"
    "apps/web/src/components/editor/ai-subtitle-panel.tsx"
    "apps/web/src/app/demo/subtitle-integration/page.tsx"
)

missing_files=()
existing_files=()

for file in "${core_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
        existing_files+=("$file")
    else
        echo "❌ $file (缺失)"
        missing_files+=("$file")
    fi
done

echo ""
echo "📊 文件状态统计："
echo "✅ 已存在: ${#existing_files[@]} 个文件"
echo "❌ 缺失: ${#missing_files[@]} 个文件"

if [ ${#missing_files[@]} -eq 0 ]; then
    echo ""
    echo "🎉 所有一键剪辑功能文件都已完整复制！"
    echo "💡 现在可以运行项目来测试一键剪辑功能了"
    
    echo ""
    echo "🚀 测试建议："
    echo "1. 运行项目: npm run dev"
    echo "2. 打开编辑器页面"
    echo "3. 在媒体面板中找到'AI编辑'标签"
    echo "4. 点击'生成Mock数据'按钮"
    echo "5. 点击'一键剪辑'按钮测试功能"
else
    echo ""
    echo "⚠️ 以下文件缺失，需要重新复制："
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
    echo ""
    echo "请重新运行 copy-ai-editing-files.sh 脚本"
fi
