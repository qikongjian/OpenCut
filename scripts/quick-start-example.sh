#!/bin/bash

# OpenCut功能开发工作流快速示例
# 演示如何使用自动化脚本

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "=================================================="
echo "    OpenCut 功能开发工作流 - 快速示例"
echo "=================================================="
echo -e "${NC}"

echo -e "${BLUE}这个示例将演示如何使用自动化脚本开发新功能${NC}"
echo ""

echo "示例功能需求: 添加视频滤镜效果"
echo ""

echo -e "${GREEN}步骤1: 运行自动化脚本${NC}"
echo "命令: ./scripts/feature-development-workflow.sh"
echo ""

echo -e "${GREEN}步骤2: 输入功能需求${NC}"
echo "当脚本提示时，输入: 添加视频滤镜效果"
echo ""

echo -e "${GREEN}步骤3: 查看生成的文件${NC}"
echo "脚本会在 feature-outputs/ 目录下创建以下结构:"
echo ""
echo "feature_YYYYMMDD_HHMMSS/"
echo "├── requirement.txt                    # 功能需求"
echo "├── 01_product_manager/"
echo "│   ├── 需求分析.md                   # 产品需求分析"
echo "│   └── 原型图说明.md                 # 原型设计说明"
echo "├── 02_ui_designer/"
echo "│   ├── UI设计方案.md                 # UI设计方案"
echo "│   └── 设计系统更新.md               # 设计系统更新"
echo "├── 03_frontend_developer/"
echo "│   ├── 开发计划.md                   # 开发计划"
echo "│   └── 技术实现文档.md               # 技术实现文档"
echo "├── 04_test_engineer/"
echo "│   ├── 功能测试计划.md               # 测试计划"
echo "│   └── 测试报告.md                   # 测试报告"
echo "└── 工作流总结.md                     # 工作流总结"
echo ""

echo -e "${GREEN}步骤4: 各角色完善文档${NC}"
echo "1. 🎯 产品经理完善需求分析和原型设计"
echo "2. 🎨 UI/UX设计师完成界面设计"
echo "3. 💻 前端开发工程师实现功能代码"
echo "4. 🧪 测试工程师执行测试验证"
echo ""

echo -e "${BLUE}现在开始运行示例...${NC}"
echo ""

# 自动运行脚本示例
if [ -f "./scripts/feature-development-workflow.sh" ]; then
    echo "添加视频滤镜效果" | ./scripts/feature-development-workflow.sh
    echo ""
    echo -e "${GREEN}✅ 示例执行完成！${NC}"
    echo ""
    echo "请查看 feature-outputs/ 目录下的最新文件夹"
    echo "各角色可以根据生成的模板文档开始工作"
else
    echo -e "${RED}错误: 找不到工作流脚本文件${NC}"
    echo "请确保在项目根目录运行此脚本"
fi
