#!/bin/bash

# OpenCut 前端部署脚本
# 使用方法: ./opencut_frontend_deploy.sh [--force|-f]
# 参数说明:
#   --force, -f: 强制重新下载 tar 包，即使本地已存在
# 
# 功能特性:
#   - 智能检测本地包文件
#   - 交互式选择是否下载
#   - 自动验证文件完整性

# Set variables
PROJECT_NAME="opencut-frontend"
PROFILE_ENV="main_1"
BASE_DIR="/home/mf/apps/frontend"
PROJECT_DIR="${BASE_DIR}/${PROJECT_NAME}"
DIST_DIR="${PROJECT_DIR}/dist"
PORT=3000
NEXUS_URL="https://repo.qikongjian.com/repository/frontend-tar-files/"
NEXUS_USER="admin"
NEXUS_PASS="YZ9Gq6=8\*G|?:,"
CONTAINER_NAME="${PROJECT_NAME}-container-${PROFILE_ENV}"
IMAGE_NAME="${PROJECT_NAME}:${PROFILE_ENV}"

# Create directories
mkdir -p $PROJECT_DIR
mkdir -p $DIST_DIR
echo "Setting deployment directory to $PROJECT_DIR for the ${PROFILE_ENV} environment."

# Stop and remove existing container
if [ $(docker ps -a -q -f name=^/${CONTAINER_NAME}$) ]; then
    echo "Container $CONTAINER_NAME already exists, stopping..."
    docker stop $CONTAINER_NAME
    echo "Removing existing container..."
    docker rm $CONTAINER_NAME
fi

# Download and extract the tar file
echo "Checking if tar file already exists..."
TAR_FILE="OpenCut-${PROFILE_ENV}.tar.gz"

# 检查是否需要强制重新下载
FORCE_DOWNLOAD=false
if [ "$1" = "--force" ] || [ "$1" = "-f" ]; then
    FORCE_DOWNLOAD=true
    echo "Force download flag detected, will re-download tar file..."
fi

if [ -f "$TAR_FILE" ] && [ "$FORCE_DOWNLOAD" = false ]; then
    # 检查文件大小是否合理（至少 10MB）
    FILE_SIZE=$(stat -c%s "$TAR_FILE" 2>/dev/null || stat -f%z "$TAR_FILE" 2>/dev/null || echo "0")
    if [ "$FILE_SIZE" -gt 10485760 ]; then  # 10MB in bytes
        echo "Tar file $TAR_FILE already exists (size: $(($FILE_SIZE / 1048576))MB)"
        echo ""
        echo "请选择操作:"
        echo "1) 使用现有包文件 (跳过下载)"
        echo "2) 重新下载包文件"
        echo ""
        read -p "请输入选择 (1 或 2): " choice
        
        case $choice in
            1)
                echo "使用现有包文件，跳过下载..."
                SKIP_DOWNLOAD=true
                ;;
            2)
                echo "重新下载包文件..."
                SKIP_DOWNLOAD=false
                ;;
            *)
                echo "无效选择，默认使用现有包文件..."
                SKIP_DOWNLOAD=true
                ;;
        esac
    else
        echo "Existing tar file seems corrupted (size: ${FILE_SIZE} bytes), will re-download..."
        SKIP_DOWNLOAD=false
    fi
else
    SKIP_DOWNLOAD=false
fi

if [ "$SKIP_DOWNLOAD" = false ]; then
    echo "Downloading tar file from Nexus..."
    curl -u "${NEXUS_USER}:${NEXUS_PASS}" -O "${NEXUS_URL}/${TAR_FILE}"
    if [ $? -ne 0 ]; then
        echo "Failed to download tar file from Nexus"
        exit 1
    fi
    
    # 验证下载的文件大小
    NEW_FILE_SIZE=$(stat -c%s "$TAR_FILE" 2>/dev/null || stat -f%z "$TAR_FILE" 2>/dev/null || echo "0")
    echo "Downloaded file size: $(($NEW_FILE_SIZE / 1048576))MB"
else
    echo "跳过下载，使用现有包文件: $TAR_FILE"
fi

echo "Extracting tar file..."
tar -xzvf "${TAR_FILE}" -C "$DIST_DIR" --strip-components=1
if [ $? -ne 0 ]; then
    echo "Failed to extract tar file"
    exit 1
fi

# Check if environment file exists
if [ ! -f ${BASE_DIR}/envs/.${PROJECT_NAME}.env ]; then
    echo "Environment file: ${BASE_DIR}/envs/.${PROJECT_NAME}.env does not exist"
    echo "Creating default environment file..."
    mkdir -p ${BASE_DIR}/envs
    cat > ${BASE_DIR}/envs/.${PROJECT_NAME}.env << 'EOF'
# OpenCut Frontend Environment Variables
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
    echo "Default environment file created. Please review and update as needed."
fi

# Create Dockerfile in the project directory
cat > $PROJECT_DIR/Dockerfile << 'EOF'
FROM node:20.19.0-alpine

WORKDIR /app

# 使用清华镜像源解决网络问题
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories

# 安装必要的系统依赖
RUN apk update && \
    apk add --no-cache libc6-compat && \
    rm -rf /var/cache/apk/*

# 先复制 workspace 根文件用于依赖解析
COPY dist/root-package.json ./package.json
COPY dist/bun.lock ./
COPY dist/packages ./packages

# 安装 bun 和 workspace 依赖
RUN npm install -g bun --registry=https://registry.npmmirror.com
RUN rm -f bun.lock && bun install --production

# 复制 web 应用文件到根目录
COPY dist/.next ./.next
COPY dist/public ./public

# 使用 web 应用的 package.json（包含 start 脚本）
COPY dist/web-package.json ./package.json

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# 启动应用
CMD ["bun", "run", "start"]
EOF

# Build Docker image
echo "Building Docker image..."
docker build -t $IMAGE_NAME $PROJECT_DIR
if [ $? -ne 0 ]; then
    echo "Failed to build Docker image"
    exit 1
fi

# Run the new container
echo "Starting new container..."
docker run -d \
  -p $PORT:3000 \
  -e TZ=Asia/Shanghai \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  --env-file ${BASE_DIR}/envs/.${PROJECT_NAME}.env \
  $IMAGE_NAME

if [ $? -ne 0 ]; then
    echo "Failed to start new container"
    exit 1
fi

# Wait for deployment to complete
echo "Waiting for deployment to complete..."
for i in {1..30}; do
    if curl -s http://localhost:$PORT > /dev/null 2>&1; then
        echo "Deployment successful - application is responding"
        break
    fi
    echo "Waiting for application to start... (attempt $i/30)"
    sleep 2
done

# Check if deployment was successful
if [ $i -eq 30 ]; then
    echo "Deployment may have failed - application not responding after 60 seconds"
    echo "Container logs:"
    docker logs $CONTAINER_NAME
    exit 1
fi

# Additional health check
echo "Performing additional health checks..."
sleep 5

# Check if container is running
if [ ! "$(docker ps -q -f name=^/${CONTAINER_NAME}$)" ]; then
    echo "Container is not running. Container logs:"
    docker logs $CONTAINER_NAME
    exit 1
fi

# Check container status
CONTAINER_STATUS=$(docker inspect --format='{{.State.Status}}' $CONTAINER_NAME)
if [ "$CONTAINER_STATUS" != "running" ]; then
    echo "Container is not in running state. Status: $CONTAINER_STATUS"
    echo "Container logs:"
    docker logs $CONTAINER_NAME
    exit 1
fi

# Clean up
echo "Cleaning up..."
rm -f "OpenCut-${PROFILE_ENV}.tar.gz"
rm -f $PROJECT_DIR/Dockerfile

# Clean up unused Docker images
docker image prune -a -f

echo "Deployment completed successfully at $(date)"
echo "Application is running on http://localhost:$PORT"
echo "Container name: $CONTAINER_NAME"
echo "Container status: $CONTAINER_STATUS"
