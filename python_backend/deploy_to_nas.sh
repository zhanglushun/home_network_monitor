#!/bin/bash

# 贾维斯智能监控系统 - FN OS NAS 一键部署脚本

set -e

echo "=========================================="
echo "  贾维斯智能监控系统 - FN OS部署"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查Docker
echo -e "${YELLOW}[1/7]${NC} 检查Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ 错误: 未找到Docker${NC}"
    echo "请先安装Docker: https://docs.docker.com/engine/install/"
    exit 1
fi
echo -e "${GREEN}✓ Docker已安装: $(docker --version)${NC}"

# 检查docker-compose
echo ""
echo -e "${YELLOW}[2/7]${NC} 检查docker-compose..."
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}⚠️  未找到docker-compose，尝试使用docker compose${NC}"
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
    echo -e "${GREEN}✓ docker-compose已安装: $(docker-compose --version)${NC}"
fi

# 检查环境变量文件
echo ""
echo -e "${YELLOW}[3/7]${NC} 检查配置文件..."
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  未找到.env文件，从模板创建...${NC}"
    cp .env.template .env
    echo -e "${GREEN}✓ 已创建.env文件${NC}"
    echo -e "${YELLOW}请编辑.env文件，填入必要的配置信息${NC}"
    echo ""
    echo "必填项："
    echo "  - ROUTER_PASSWORD (路由器密码)"
    echo ""
    read -p "是否现在编辑.env文件? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ${EDITOR:-nano} .env
    else
        echo -e "${RED}请手动编辑.env文件后重新运行此脚本${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ 找到.env文件${NC}"
fi

# 创建数据目录
echo ""
echo -e "${YELLOW}[4/7]${NC} 创建数据目录..."
mkdir -p data logs
echo -e "${GREEN}✓ 数据目录已创建${NC}"

# 停止旧容器
echo ""
echo -e "${YELLOW}[5/7]${NC} 停止旧容器..."
$DOCKER_COMPOSE down 2>/dev/null || true
echo -e "${GREEN}✓ 旧容器已停止${NC}"

# 构建镜像
echo ""
echo -e "${YELLOW}[6/7]${NC} 构建Docker镜像..."
$DOCKER_COMPOSE build
echo -e "${GREEN}✓ 镜像构建完成${NC}"

# 启动服务
echo ""
echo -e "${YELLOW}[7/7]${NC} 启动服务..."
$DOCKER_COMPOSE up -d
echo -e "${GREEN}✓ 服务已启动${NC}"

# 等待服务启动
echo ""
echo -e "${YELLOW}等待服务启动...${NC}"
sleep 5

# 检查服务状态
echo ""
echo -e "${YELLOW}检查服务状态...${NC}"
if curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${GREEN}✓ 服务运行正常！${NC}"
else
    echo -e "${RED}⚠️  服务可能未正常启动，请查看日志${NC}"
    echo "运行以下命令查看日志："
    echo "  $DOCKER_COMPOSE logs -f"
fi

# 显示访问信息
echo ""
echo "=========================================="
echo -e "${GREEN}  部署完成！${NC}"
echo "=========================================="
echo ""
echo "访问地址："
echo "  - 本地: http://localhost:3000"
echo "  - 局域网: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "管理命令："
echo "  - 查看日志: $DOCKER_COMPOSE logs -f"
echo "  - 停止服务: $DOCKER_COMPOSE stop"
echo "  - 启动服务: $DOCKER_COMPOSE start"
echo "  - 重启服务: $DOCKER_COMPOSE restart"
echo "  - 删除服务: $DOCKER_COMPOSE down"
echo ""
echo "健康检查："
echo "  curl http://localhost:3000/health"
echo ""
echo "API文档："
echo "  http://localhost:3000/docs"
echo ""
