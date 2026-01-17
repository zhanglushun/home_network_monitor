#!/bin/bash

# 贾维斯网络监控系统 - 一键部署脚本（飞牛OS NAS）
# 使用方法：bash deploy.sh

set -e

echo "=========================================="
echo "  贾维斯网络监控系统 - 一键部署"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}提示: 某些操作可能需要sudo权限${NC}"
fi

# 步骤1: 检查Docker
echo -e "${BLUE}[1/6] 检查Docker环境...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: 未检测到Docker，请先安装Docker${NC}"
    echo "飞牛OS安装Docker: 应用中心 -> Docker -> 安装"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}警告: 未检测到docker-compose，尝试使用docker compose...${NC}"
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo -e "${GREEN}✓ Docker环境检查通过${NC}"
echo ""

# 步骤2: 配置环境变量
echo -e "${BLUE}[2/6] 配置环境变量...${NC}"
if [ ! -f .env ]; then
    if [ -f .env.template ]; then
        cp .env.template .env
        echo -e "${YELLOW}已创建.env文件，请编辑填写配置信息${NC}"
        echo ""
        echo -e "${YELLOW}必须配置的项目：${NC}"
        echo "  - DATABASE_URL: 数据库连接地址"
        echo "  - JWT_SECRET: JWT密钥（随机字符串）"
        echo "  - ISTOREOS_PASSWORD: 路由器密码"
        echo ""
        read -p "是否现在编辑.env文件？(y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ${EDITOR:-nano} .env
        else
            echo -e "${RED}请手动编辑.env文件后重新运行此脚本${NC}"
            exit 1
        fi
    else
        echo -e "${RED}错误: 未找到.env.template文件${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ .env文件已存在${NC}"
fi
echo ""

# 步骤3: 检查配置
echo -e "${BLUE}[3/6] 验证配置...${NC}"
source .env

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}错误: DATABASE_URL未配置${NC}"
    exit 1
fi

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "change-this-to-a-random-secret-key-at-least-32-characters-long" ]; then
    echo -e "${RED}错误: JWT_SECRET未配置或使用默认值${NC}"
    exit 1
fi

if [ -z "$ISTOREOS_PASSWORD" ] || [ "$ISTOREOS_PASSWORD" = "your-router-password-here" ]; then
    echo -e "${RED}错误: ISTOREOS_PASSWORD未配置${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 配置验证通过${NC}"
echo ""

# 步骤4: 创建数据目录
echo -e "${BLUE}[4/6] 创建数据目录...${NC}"
mkdir -p data
chmod 755 data
echo -e "${GREEN}✓ 数据目录创建完成${NC}"
echo ""

# 步骤5: 构建Docker镜像
echo -e "${BLUE}[5/6] 构建Docker镜像...${NC}"
echo "这可能需要几分钟时间..."
$DOCKER_COMPOSE build
echo -e "${GREEN}✓ Docker镜像构建完成${NC}"
echo ""

# 步骤6: 启动服务
echo -e "${BLUE}[6/6] 启动服务...${NC}"
$DOCKER_COMPOSE up -d
echo -e "${GREEN}✓ 服务启动完成${NC}"
echo ""

# 等待服务启动
echo -e "${BLUE}等待服务启动...${NC}"
sleep 10

# 检查服务状态
if $DOCKER_COMPOSE ps | grep -q "Up"; then
    echo -e "${GREEN}=========================================="
    echo "  部署成功！"
    echo "==========================================${NC}"
    echo ""
    echo "访问地址: http://$(hostname -I | awk '{print $1}'):3000"
    echo "或者: http://192.168.100.221:3000"
    echo ""
    echo "常用命令："
    echo "  查看日志: $DOCKER_COMPOSE logs -f"
    echo "  停止服务: $DOCKER_COMPOSE stop"
    echo "  启动服务: $DOCKER_COMPOSE start"
    echo "  重启服务: $DOCKER_COMPOSE restart"
    echo "  删除服务: $DOCKER_COMPOSE down"
    echo ""
else
    echo -e "${RED}=========================================="
    echo "  部署失败"
    echo "==========================================${NC}"
    echo ""
    echo "请检查日志: $DOCKER_COMPOSE logs"
    exit 1
fi
