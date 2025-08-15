#!/bin/bash

echo "🚀 开始复制一键剪辑功能文件..."

# 确保在main_1分支上
git checkout main_1

# 从main分支复制所有一键剪辑相关文件
echo "📁 复制AI编辑状态管理文件..."
git checkout main -- apps/web/src/stores/ai-editing-store.ts

echo "📁 复制AI编辑面板组件..."
git checkout main -- apps/web/src/components/editor/ai-editing-panel.tsx

echo "📁 复制AI编辑Mock数据..."
git checkout main -- apps/web/src/lib/ai-editing-mock-data.ts

echo "📁 复制AI字幕集成..."
git checkout main -- apps/web/src/lib/ai-subtitle-integration.ts

echo "📁 复制字幕解析器..."
git checkout main -- apps/web/src/lib/subtitle-parser.ts

echo "📁 复制视频预览状态管理..."
git checkout main -- apps/web/src/stores/video-preview-store.ts

echo "📁 复制视频缩略图组件..."
git checkout main -- apps/web/src/components/editor/video-thumbnail.tsx

echo "📁 复制时间轴类型定义..."
git checkout main -- apps/web/src/types/timeline.ts

echo "📁 复制媒体面板Store（包含AI编辑标签）..."
git checkout main -- apps/web/src/components/editor/media-panel/store.ts

echo "📁 复制媒体面板主组件（包含AI编辑面板集成）..."
git checkout main -- apps/web/src/components/editor/media-panel/index.tsx

echo "📁 复制字幕集成验证文件..."
git checkout main -- apps/web/src/lib/subtitle-integration-verification.ts

echo "📁 复制字幕集成测试文件..."
git checkout main -- apps/web/src/lib/__tests__/subtitle-integration.test.ts

echo "📁 复制AI字幕面板..."
git checkout main -- apps/web/src/components/editor/ai-subtitle-panel.tsx

echo "📁 复制字幕集成演示页面..."
git checkout main -- apps/web/src/app/demo/subtitle-integration/page.tsx

echo "✅ 所有一键剪辑相关文件复制完成！"

# 显示当前状态
echo "📊 当前文件状态："
git status --porcelain

echo "🎉 一键剪辑功能已成功添加到main_1分支！"
echo "💡 现在可以运行项目来测试一键剪辑功能了"
