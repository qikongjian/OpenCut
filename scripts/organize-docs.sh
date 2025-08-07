#!/bin/bash

# OpenCut 文档整理脚本
# 此脚本将分散的 .md 文件整理到统一的 docs 目录结构中

echo "🚀 开始整理 OpenCut 项目文档..."

# 创建目录结构
mkdir -p docs/{development,features,technical,planning,archive}

echo "📁 创建文档目录结构完成"

# 移动功能相关文档
echo "📝 整理功能文档..."
mv "剪辑.md" "docs/features/video-cutting.md" 2>/dev/null
mv "导入.md" "docs/features/import.md" 2>/dev/null
mv "导出.md" "docs/features/export.md" 2>/dev/null
mv "转场.md" "docs/features/transitions.md" 2>/dev/null
mv "配字幕.md" "docs/features/subtitles.md" 2>/dev/null
mv "音乐.md" "docs/features/audio.md" 2>/dev/null
mv "插入.md" "docs/features/insert.md" 2>/dev/null
mv "覆盖.md" "docs/features/overlay.md" 2>/dev/null
mv "蒙板.md" "docs/features/mask.md" 2>/dev/null
mv "镜像.md" "docs/features/mirror.md" 2>/dev/null
mv "加减速.md" "docs/features/speed-control.md" 2>/dev/null
mv "调顺序.md" "docs/features/reorder.md" 2>/dev/null
mv "智能文本.md" "docs/features/smart-text.md" 2>/dev/null
mv "返回上一步操作.md" "docs/features/undo-redo.md" 2>/dev/null

# 移动技术文档
echo "🔧 整理技术文档..."
mv "OpenCut前端技术文档.md" "docs/technical/frontend.md" 2>/dev/null
mv "OpenCut后端技术.md" "docs/technical/backend.md" 2>/dev/null
mv "TECHNICAL_DOCUMENTATION.md" "docs/technical/architecture.md" 2>/dev/null
mv "iframe实现计划.md" "docs/technical/iframe-integration.md" 2>/dev/null
mv "剪映集成方案.md" "docs/technical/capcut-integration.md" 2>/dev/null

# 移动规划文档
echo "📋 整理规划文档..."
mv "OpenCut功能实现计划.md" "docs/planning/implementation-plan.md" 2>/dev/null
mv "OpenCut-Cursor开发任务清单.md" "docs/planning/task-list.md" 2>/dev/null
mv "视频编辑功能需求分析.md" "docs/planning/requirements.md" 2>/dev/null
mv "开源视频编辑器对比分析.md" "docs/planning/competitor-analysis.md" 2>/dev/null

# 移动开发文档
echo "👨‍💻 整理开发文档..."
mv "layout.md" "docs/development/layout-guide.md" 2>/dev/null

# 移动文本文件到归档
echo "📦 归档其他文件..."
mv "OpenCut前端代码学习路径.txt" "docs/archive/" 2>/dev/null
mv "addVideo.text" "docs/archive/" 2>/dev/null
mv "ffmpeg.text" "docs/archive/" 2>/dev/null
mv "iframe集成方案.text" "docs/archive/" 2>/dev/null
mv "optimize.text" "docs/archive/" 2>/dev/null
mv "postMessage内存限制详解.text" "docs/archive/" 2>/dev/null

# 创建文档索引更新
echo "📚 更新文档索引..."

# 在 README.md 中添加文档链接
if ! grep -q "📖 Documentation" README.md; then
    sed -i '/## 🎥 Key Features/i\
## 📖 Documentation\
\
- [📚 Complete Documentation](./docs) - All project documentation\
- [🚀 Quick Start Guide](./docs/development/setup.md) - Get started in minutes\
- [🎬 Feature Overview](./docs/features/overview.md) - All available features\
- [🏗️ Technical Architecture](./docs/technical/architecture.md) - System design\
- [📋 Development Planning](./docs/planning/roadmap.md) - Project roadmap\
\
' README.md
fi

echo "✅ 文档整理完成！"
echo ""
echo "📁 新的文档结构："
echo "docs/"
echo "├── README.md              # 文档导航"
echo "├── development/           # 开发相关文档"
echo "│   ├── setup.md          # 环境搭建"
echo "│   ├── contributing.md   # 贡献指南"
echo "│   └── layout-guide.md   # 布局指南"
echo "├── features/              # 功能文档"
echo "│   ├── overview.md       # 功能概览"
echo "│   ├── video-cutting.md  # 视频剪辑"
echo "│   ├── import.md         # 导入功能"
echo "│   └── ..."
echo "├── technical/             # 技术文档"
echo "│   ├── architecture.md   # 技术架构"
echo "│   ├── frontend.md       # 前端技术"
echo "│   └── backend.md        # 后端技术"
echo "├── planning/              # 规划文档"
echo "│   ├── roadmap.md        # 发展路线"
echo "│   ├── requirements.md   # 需求分析"
echo "│   └── task-list.md      # 任务清单"
echo "└── archive/               # 归档文件"
echo ""
echo "🎉 现在您可以通过 docs/README.md 访问所有文档！"
