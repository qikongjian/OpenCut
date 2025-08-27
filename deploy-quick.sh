#!/bin/bash

# OpenCut快速部署脚本
# 简化版本，一键部署

# 配置
PROJECT_PATH="/Users/lishuqing/PycharmProjects/OpenCut"
SERVER="mf@39.105.24.90"
SERVER_PATH="/home/mf"
PORT="3000"

# 颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 OpenCut 快速部署开始...${NC}"

# 1. 创建压缩包
echo -e "${BLUE}📦 创建项目压缩包...${NC}"
cd "$PROJECT_PATH"
rm -f OpenCut.zip
zip -r OpenCut.zip . -x ".git/*" ".DS_Store" "*.tmp"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 压缩包创建失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 压缩包创建成功${NC}"

# 2. 上传到服务器
echo -e "${BLUE}📤 上传到服务器...${NC}"
scp OpenCut.zip "$SERVER:$SERVER_PATH/"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 上传失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 上传成功${NC}"

# 3. 在服务器上部署
echo -e "${BLUE}🔧 在服务器上部署...${NC}"
ssh "$SERVER" << 'EOF'
    echo "=== 开始部署 ==="
    
    # 杀死占用3000端口的进程
    PORT_PID=$(sudo netstat -tlnp 2>/dev/null | grep ":3000 " | awk '{print $7}' | cut -d'/' -f1)
    if [ ! -z "$PORT_PID" ]; then
        echo "杀死进程: $PORT_PID"
        sudo kill -9 "$PORT_PID"
        sleep 2
    fi
    
    # 检查并删除旧文件夹
    if [ -d "/home/mf/OpenCut" ]; then
        echo "删除旧文件夹..."
        rm -rf /home/mf/OpenCut
        if [ $? -ne 0 ]; then
            echo "删除旧文件夹失败，退出部署"
            exit 1
        fi
    fi
    
    # 验证旧文件夹已删除
    if [ -d "/home/mf/OpenCut" ]; then
        echo "旧文件夹仍然存在，无法继续部署"
        exit 1
    fi
    
    # 解压新文件
    cd /home/mf
    unzip -q OpenCut.zip
    
    # 启动项目
    cd OpenCut
    nohup bun run dev > out.log 2>&1 &
    
    echo "等待启动..."
    sleep 5
    
    # 检查状态
    echo "端口状态:"
    sudo netstat -tlnp | grep ":3000 " || echo "端口3000未运行"
    
    echo "进程状态:"
    ps aux | grep "bun run dev" | grep -v grep || echo "未找到进程"
    
    echo "=== 部署完成 ==="
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 部署失败${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 部署完成！${NC}"
echo -e "${BLUE}🌐 访问地址: http://39.105.24.90:3000${NC}"

# 询问是否查看日志
read -p "是否查看日志？(y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}📋 查看日志...${NC}"
    ssh "$SERVER" "tail -f -n 100 /home/mf/OpenCut/out.log"
fi
