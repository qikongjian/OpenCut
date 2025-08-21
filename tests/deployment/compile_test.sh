#!/bin/bash

BRANCH_NAME="dev"

# 修改项目名称
PROJECT_NAME="video-flow-frontend-test"

# 设置日志文件路径
LOGFILE="build_and_copy.log"

# 记录开始时间
echo "Build process started at $(date)" | tee $LOGFILE

# 获取当前分支名
current_branch=$(git rev-parse --abbrev-ref HEAD)
 
# 打包之前，需要检查是否在 dev 分支，工作区是否干净，是否和远程分支一致
if [ "$(git branch --show-current)" != "$BRANCH_NAME" ]; then
    echo "当前分支不是 dev 分支"
    exit 1
fi

# 检查工作区是否干净
if [ -n "$(git status --porcelain)" ]; then
    echo "工作区不干净"
    exit 1
fi

# 检查远程分支是否和本地分支一致
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/$BRANCH_NAME)" ]; then
    echo "本地分支和远程分支不一致"
    exit 1
fi


# 检查当前分支并运行相应的 npm 命令
if [ "$current_branch" = "$BRANCH_NAME" ]; then
    echo "On dev branch, building project..." | tee -a $LOGFILE
    PROFILE_ENV=$BRANCH_NAME

    # 安装依赖并构建
    yarn install
    yarn build

    # 准备dist目录
    mkdir -p dist
    cp -r .next dist/
    cp -r public dist/
    cp package.json dist/
    cp package-lock.json dist/

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
