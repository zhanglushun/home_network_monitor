# 多阶段构建：前端 + 后端

# ============================================
# 阶段1: 构建React前端
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

# 复制前端package文件
COPY client/package*.json ./

# 安装前端依赖
RUN npm install

# 复制前端源代码
COPY client/ ./

# 构建前端
RUN npm run build

# ============================================
# 阶段2: 构建Python后端
# ============================================
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖（包括ping等网络工具）
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    iputils-ping \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 复制Python依赖文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制Python应用代码
COPY python_backend/ .

# 从前端构建阶段复制构建产物
COPY --from=frontend-builder /frontend/dist /app/client/dist

# 暴露端口
EXPOSE 3001

# 设置环境变量
ENV PORT=3001
ENV NODE_ENV=production

# 启动命令
CMD ["python3", "main.py"]
