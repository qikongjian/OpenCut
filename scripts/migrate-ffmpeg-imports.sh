#!/bin/bash

# FFmpeg 模块重构迁移脚本
# 自动更新所有 ffmpeg-utils 导入为新的模块化结构

echo "🚀 开始 FFmpeg 模块重构迁移..."

# 定义项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APPS_WEB_SRC="$PROJECT_ROOT/apps/web/src"

echo "📂 项目根目录: $PROJECT_ROOT"
echo "📂 源码目录: $APPS_WEB_SRC"

# 1. 查找所有需要更新的文件
echo "🔍 查找需要更新的文件..."
find "$APPS_WEB_SRC" -name "*.ts" -o -name "*.tsx" | xargs grep -l "ffmpeg-utils" > /tmp/files_to_migrate.txt

echo "📋 需要迁移的文件列表:"
cat /tmp/files_to_migrate.txt

# 2. 批量替换导入路径
echo "🔄 开始批量替换导入路径..."

while IFS= read -r file; do
    if [ -f "$file" ]; then
        echo "📝 处理文件: $file"
        
        # 替换各种导入模式
        sed -i.bak \
            -e 's|from ['\''"]@/lib/ffmpeg-utils['\''"]|from "@/lib/ffmpeg"|g' \
            -e 's|from ['\''"]\.\.*/lib/ffmpeg-utils['\''"]|from "../../lib/ffmpeg"|g' \
            -e 's|from ['\''"]\.*/ffmpeg-utils['\''"]|from "./ffmpeg"|g' \
            -e 's|import.*ffmpeg-utils|import { exportTimeline, exportVideo, trimVideo, convertToWebM, generateThumbnail, getVideoInfo, initFFmpeg, testFFmpeg, cancelCurrentExport, resetExportCancellation, clearExportCache, getCacheStats } from "@/lib/ffmpeg"|g' \
            "$file"
        
        # 删除备份文件
        rm -f "$file.bak"
        
        echo "✅ 完成: $file"
    fi
done < /tmp/files_to_migrate.txt

# 3. 验证迁移结果
echo "🔍 验证迁移结果..."
remaining=$(find "$APPS_WEB_SRC" -name "*.ts" -o -name "*.tsx" | xargs grep -l "ffmpeg-utils" | wc -l)

if [ "$remaining" -eq 0 ]; then
    echo "✅ 所有文件已成功迁移！"
else
    echo "⚠️  还有 $remaining 个文件需要手动处理:"
    find "$APPS_WEB_SRC" -name "*.ts" -o -name "*.tsx" | xargs grep -l "ffmpeg-utils"
fi

# 4. 生成迁移报告
echo "📊 生成迁移报告..."
cat > "$PROJECT_ROOT/ffmpeg-migration-report.md" << EOF
# FFmpeg 模块重构迁移报告

## 📅 迁移时间
$(date)

## 📊 迁移统计
- 处理文件数量: $(wc -l < /tmp/files_to_migrate.txt)
- 剩余未迁移文件: $remaining

## 🎯 重构目标
- ✅ 模块化设计
- ✅ 单一职责原则
- ✅ 提升可维护性
- ✅ 优化性能

## 📁 新的模块结构
\`\`\`
src/lib/ffmpeg/
├── index.ts                    # 主入口
├── types/ffmpeg-types.ts       # 类型定义
├── core/
│   ├── init.ts                # 初始化
│   └── config.ts              # 配置
├── utils/export-utils.ts       # 工具函数
├── operations/
│   ├── basic-video-ops.ts     # 基础操作
│   ├── timeline-export.ts     # 时间轴导出
│   └── audio-ops.ts           # 音频操作
└── effects/video-effects.ts    # 视频特效
\`\`\`

## 🚀 使用方式
\`\`\`typescript
// 新的导入方式
import { exportTimeline, exportVideo } from '@/lib/ffmpeg';
import type { TimelineData, ExportConfig } from '@/lib/ffmpeg';
\`\`\`

## ✨ 优势
1. **可维护性**: 代码分离，职责明确
2. **性能**: 按需加载，减少包大小
3. **开发体验**: 更好的 IDE 支持和类型提示
4. **团队协作**: 减少代码冲突

EOF

echo "📄 迁移报告已生成: $PROJECT_ROOT/ffmpeg-migration-report.md"

# 5. 清理临时文件
rm -f /tmp/files_to_migrate.txt

echo "🎉 FFmpeg 模块重构迁移完成！"
echo ""
echo "📋 下一步操作："
echo "1. 运行 'npm run build' 检查构建是否成功"
echo "2. 运行测试确保功能正常"
echo "3. 检查并手动处理任何剩余的导入问题"
echo "4. 可以安全删除原有的 ffmpeg-utils.ts 文件"
echo ""
echo "🎯 重构完成后的优势："
echo "- 📦 模块化设计，易于维护"
echo "- 🚀 按需加载，性能提升"
echo "- 🔧 单元测试更容易编写"
echo "- 👥 团队协作更高效" 