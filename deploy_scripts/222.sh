#!/bin/bash

# 项目配置
PROJECT_NAME="movie-flow-cut-test"
PROFILE_ENV="dev"
PORT=3000
CONTAINER_NAME="${PROJECT_NAME}-container"
IMAGE_NAME="${PROJECT_NAME}:latest"

# 创建日志文件
LOGFILE="deploy.log"
echo "Deployment started at $(date)" | tee $LOGFILE

# 停止并删除已存在的容器
if [ $(docker ps -a -q -f name=^/${CONTAINER_NAME}$) ]; then
    echo "停止并删除已存在的容器..." | tee -a $LOGFILE
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
fi

# 构建项目
echo "开始构建项目..." | tee -a $LOGFILE
yarn install
yarn build

# 准备构建目录
echo "准备构建文件..." | tee -a $LOGFILE
mkdir -p dist
cp -r .next dist/
cp -r public dist/
cp package.json dist/

# 创建环境变量文件
if [ ! -f .env ]; then
    echo "创建默认环境变量文件..." | tee -a $LOGFILE
    cat > .env << 'EOF'
# 环境变量配置
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000

# Redis配置（如果需要）
# UPSTASH_REDIS_REST_URL=your_redis_url
# UPSTASH_REDIS_REST_TOKEN=your_redis_token

# AI编辑API配置
# AI_EDITING_PLAN_API_URL=your_api_url
# NEXT_PUBLIC_AI_EDITING_PLAN_API_URL=your_public_api_url

# 七牛云配置
# QINIU_ACCESS_KEY=your_access_key
# QINIU_SECRET_KEY=your_secret_key
# QINIU_BUCKET_NAME=your_bucket_name
# QINIU_DOMAIN=your_domain
EOF
    echo "请修改 .env 文件中的配置..." | tee -a $LOGFILE
fi

# 创建 Dockerfile
echo "创建 Dockerfile..." | tee -a $LOGFILE
cat > Dockerfile << 'EOF'
FROM node:20.19.0-alpine

WORKDIR /app

# 使用国内镜像源
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories

# 安装必要的系统依赖
RUN apk update && \
    apk add --no-cache libc6-compat && \
    rm -rf /var/cache/apk/*

# 复制构建文件
COPY dist/.next ./.next
COPY dist/public ./public
COPY dist/package.json ./package.json

# 安装生产依赖
RUN yarn install --production --registry=https://registry.npmmirror.com

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# 启动应用
CMD ["yarn", "start"]
EOF

# 构建 Docker 镜像
echo "构建 Docker 镜像..." | tee -a $LOGFILE
docker build -t $IMAGE_NAME .

# 运行容器
echo "启动容器..." | tee -a $LOGFILE
docker run -d \
    --name $CONTAINER_NAME \
    -p $PORT:3000 \
    -e TZ=Asia/Shanghai \
    --restart unless-stopped \
    --env-file .env \
    $IMAGE_NAME

# 等待应用启动
echo "等待应用启动..." | tee -a $LOGFILE
for i in {1..15}; do
    if curl -s http://localhost:$PORT > /dev/null 2>&1; then
        echo "应用已成功启动！" | tee -a $LOGFILE
        break
    fi
    echo "等待应用启动中... (尝试 $i/15)" | tee -a $LOGFILE
    sleep 2
done

# 检查容器状态
if [ ! "$(docker ps -q -f name=^/${CONTAINER_NAME}$)" ]; then
    echo "容器未能正常运行，查看日志：" | tee -a $LOGFILE
    docker logs $CONTAINER_NAME
    exit 1
fi

# 清理构建文件
echo "清理构建文件..." | tee -a $LOGFILE
rm -rf dist
rm -f Dockerfile

echo "部署完成！" | tee -a $LOGFILE
echo "应用访问地址: http://localhost:$PORT" | tee -a $LOGFILE
echo "容器名称: $CONTAINER_NAME" | tee -a $LOGFILE