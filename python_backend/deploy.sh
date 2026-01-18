#!/bin/bash
# 家庭网络监控 - 飞牛OS NAS 快速部署脚本
# 使用方法: bash deploy.sh

set -e  # 遇到错误立即退出

echo "=========================================="
echo "家庭网络监控 - NAS部署脚本"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查是否在正确的目录
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}错误: 请在python_backend目录下运行此脚本${NC}"
    exit 1
fi

# 步骤1: 检查环境变量
echo -e "${YELLOW}[1/6] 检查环境变量配置...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${RED}错误: .env文件不存在${NC}"
    echo "请创建.env文件并配置以下变量："
    echo "ROUTER_URL=http://192.168.100.1"
    echo "ROUTER_USERNAME=root"
    echo "ROUTER_PASSWORD=password"
    echo "DATABASE_URL=sqlite:///./data/network_monitor.db"
    exit 1
fi

# 检查必需的环境变量
source .env
if [ -z "$ROUTER_URL" ] || [ -z "$ROUTER_USERNAME" ] || [ -z "$ROUTER_PASSWORD" ]; then
    echo -e "${RED}错误: .env文件缺少必需的路由器配置${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 环境变量配置正确${NC}"
echo "  路由器地址: $ROUTER_URL"
echo "  用户名: $ROUTER_USERNAME"
echo ""

# 步骤2: 测试路由器连接
echo -e "${YELLOW}[2/6] 测试路由器连接...${NC}"
ROUTER_IP=$(echo $ROUTER_URL | sed 's|http://||' | sed 's|https://||' | cut -d: -f1)
if ping -c 2 -W 2 $ROUTER_IP > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 路由器连接正常 ($ROUTER_IP)${NC}"
else
    echo -e "${RED}⚠ 警告: 无法ping通路由器 ($ROUTER_IP)${NC}"
    echo "  系统将使用模拟数据运行"
    read -p "是否继续部署? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo ""

# 步骤3: 停止旧容器
echo -e "${YELLOW}[3/6] 停止旧容器...${NC}"
if docker-compose ps | grep -q "Up"; then
    docker-compose down
    echo -e "${GREEN}✓ 旧容器已停止${NC}"
else
    echo -e "${GREEN}✓ 没有运行中的容器${NC}"
fi
echo ""

# 步骤4: 创建数据目录
echo -e "${YELLOW}[4/6] 创建数据目录...${NC}"
mkdir -p data
chmod 755 data
echo -e "${GREEN}✓ 数据目录已创建${NC}"
echo ""

# 步骤5: 构建镜像
echo -e "${YELLOW}[5/6] 构建Docker镜像...${NC}"
echo "  这可能需要几分钟时间..."
if docker-compose build --no-cache; then
    echo -e "${GREEN}✓ Docker镜像构建成功${NC}"
else
    echo -e "${RED}错误: Docker镜像构建失败${NC}"
    exit 1
fi
echo ""

# 步骤6: 启动容器
echo -e "${YELLOW}[6/6] 启动容器...${NC}"
if docker-compose up -d; then
    echo -e "${GREEN}✓ 容器启动成功${NC}"
else
    echo -e "${RED}错误: 容器启动失败${NC}"
    exit 1
fi
echo ""

# 等待服务启动
echo -e "${YELLOW}等待服务启动...${NC}"
sleep 5

# 检查容器状态
echo ""
echo "=========================================="
echo "部署状态检查"
echo "=========================================="
echo ""

if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓ 容器运行正常${NC}"
    echo ""
    
    # 显示日志
    echo "最近的日志输出："
    echo "----------------------------------------"
    docker-compose logs --tail=20
    echo "----------------------------------------"
    echo ""
    
    # 检查是否成功连接路由器
    if docker-compose logs | grep -q "登录成功"; then
        echo -e "${GREEN}✓ 成功连接到路由器！${NC}"
        echo -e "${GREEN}✓ 系统正在获取真实数据${NC}"
    elif docker-compose logs | grep -q "使用模拟数据"; then
        echo -e "${YELLOW}⚠ 无法连接路由器，使用模拟数据${NC}"
        echo "  请检查路由器地址和凭据是否正确"
    fi
    
    echo ""
    echo "=========================================="
    echo "部署完成！"
    echo "=========================================="
    echo ""
    echo "访问地址: http://$(hostname -I | awk '{print $1}'):3001"
    echo ""
    echo "常用命令:"
    echo "  查看日志: docker-compose logs -f"
    echo "  重启服务: docker-compose restart"
    echo "  停止服务: docker-compose down"
    echo "  查看状态: docker-compose ps"
    echo ""
else
    echo -e "${RED}✗ 容器启动失败${NC}"
    echo ""
    echo "错误日志："
    echo "----------------------------------------"
    docker-compose logs --tail=50
    echo "----------------------------------------"
    exit 1
fi
