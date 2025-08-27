#!/bin/bash

BRANCH_NAME="main_1"

# 修改项目名称
PROJECT_NAME="OpenCut"

# 设置日志文件路径
LOGFILE="build_and_copy.log"

# 记录开始时间
echo "Build process started at $(date)" | tee $LOGFILE

# 获取当前分支名
current_branch=$(git rev-parse --abbrev-ref HEAD)
 
# 打包之前，需要检查是否在 main_1 分支，工作区是否干净，是否和远程分支一致
if [ "$(git branch --show-current)" != "$BRANCH_NAME" ]; then
    echo "当前分支不是 main_1 分支"
    exit 1
fi

# 检查工作区是否干净
#if [ -n "$(git status --porcelain)" ]; then
#    echo "工作区不干净"
#    exit 1
#fi

# 检查远程分支是否和本地分支一致
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/$BRANCH_NAME)" ]; then
    echo "本地分支和远程分支不一致"
    exit 1
fi


# 检查当前分支并运行相应的构建命令
if [ "$current_branch" = "$BRANCH_NAME" ]; then
    echo "On main_1 branch, building project..." | tee -a $LOGFILE
    PROFILE_ENV=$BRANCH_NAME

    # 安装依赖并构建（使用生产环境配置）
    bun install
    # 临时将生产环境配置复制为.env.local用于构建
    cp .env.production .env.local.backup || true
    cp .env.production .env.local
    bun run build
    # 恢复原来的.env.local文件
    if [ -f .env.local.backup ]; then
        mv .env.local.backup .env.local
    else
        rm -f .env.local
    fi

    # 准备dist目录
    mkdir -p dist
    cp -r apps/web/.next dist/
    cp -r apps/web/public dist/
    cp apps/web/package.json dist/web-package.json
    cp bun.lock dist/
    
    # 复制 workspace 依赖包
    mkdir -p dist/packages
    cp -r packages/auth dist/packages/
    cp -r packages/db dist/packages/
    
    # 创建根 package.json 用于 workspace 解析
    cp package.json dist/root-package.json

else
    echo "On non-dev branch ($current_branch), exiting"
    exit 1
fi

# 创建tar包
tar -czvf $PROJECT_NAME-$PROFILE_ENV.tar.gz dist

# 记录结束时间
echo "Build process completed at $(date)" | tee -a $LOGFILE

# 上传到 nexus
echo "upload to nexus at $(date)" | tee -a $LOGFILE
curl -u 'admin':'YZ9Gq6=8\*G|?:,' --upload-file $PROJECT_NAME-$PROFILE_ENV.tar.gz https://repo.qikongjian.com/repository/frontend-tar-files/

#  清理构建文件
rm -rf dist
rm $PROJECT_NAME-$PROFILE_ENV.tar.gz
