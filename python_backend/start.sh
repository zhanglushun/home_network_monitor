#!/bin/bash

# 贾维斯智能监控系统 - Python后端启动脚本

echo "=========================================="
echo "  贾维斯智能监控系统 - Python后端"
echo "=========================================="

# 检查Python版本
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到Python3"
    exit 1
fi

echo "✓ Python版本: $(python3 --version)"

# 检查pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ 错误: 未找到pip3"
    exit 1
fi

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "⚠️  警告: 未找到.env文件，从模板复制..."
    cp .env.template .env
    echo "请编辑.env文件配置数据库和路由器信息"
    exit 1
fi

# 安装依赖
echo ""
echo "📦 安装Python依赖..."
pip3 install -r requirements.txt

# 创建数据目录
mkdir -p ../data

# 启动服务
echo ""
echo "🚀 启动Python后端服务..."
echo "访问地址: http://0.0.0.0:3000"
echo "健康检查: http://0.0.0.0:3000/health"
echo "API文档: http://0.0.0.0:3000/docs"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

python3 main.py
