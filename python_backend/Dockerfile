# 多阶段构建：前端 + Python后端

# ============================================
# 阶段1: 构建React前端
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /build

# 复制package文件
COPY package*.json ./
COPY pnpm-lock.yaml ./

# 安装pnpm
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制前端源代码
COPY client/ ./client/
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./

# 构建前端
RUN pnpm run build

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
COPY python_backend/requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制Python应用代码
COPY python_backend/ .

# 从前端构建阶段复制构建产物
COPY --from=frontend-builder /build/dist ./client/dist

# 暴露端口
EXPOSE 3001

# 设置环境变量
ENV PORT=3001
ENV NODE_ENV=production

# 启动命令
CMD ["python3", "main.py"]
