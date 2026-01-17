# 贾维斯网络监控系统 - 飞牛OS部署指南

## 📋 部署概述

本指南专门针对**飞牛OS（FNnas）**系统，提供最简单的Docker部署方案。

**您的环境**：
- NAS IP: `192.168.100.221`
- 系统: 飞牛OS
- 路由器: iStoreOS @ `192.168.100.1`

## 🚀 快速部署（推荐）

### 方案一：使用一键部署脚本

#### 1. 导出代码到GitHub

在Manus管理界面：
1. 点击右上角"设置"图标
2. 选择"GitHub"选项卡
3. 点击"导出到GitHub"
4. 记录仓库地址

#### 2. SSH连接到飞牛OS

在您的电脑上打开终端：

```bash
# SSH连接到NAS
ssh admin@192.168.100.221
# 或者
ssh root@192.168.100.221
```

> 💡 **提示**: 如果不知道SSH密码，请在飞牛OS管理界面启用SSH并设置密码：
> 系统设置 → 终端与SNMP → 启用SSH

#### 3. 克隆代码

```bash
# 进入合适的目录（例如Docker目录）
cd /volume1/docker  # 或其他您喜欢的位置

# 克隆代码
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git jarvis-monitor
cd jarvis-monitor
```

#### 4. 配置环境变量

```bash
# 复制环境变量模板
cp .env.template .env

# 编辑配置文件
nano .env
```

**必须配置的项目**：

```env
# 数据库配置（使用SQLite最简单）
DATABASE_URL="file:./data/network_monitor.db"

# JWT密钥（随机字符串，至少32位）
JWT_SECRET="your-random-secret-key-here-at-least-32-chars"

# iStoreOS路由器密码
ISTOREOS_PASSWORD="your-router-password"
```

保存并退出（Ctrl+X，然后Y，然后Enter）

#### 5. 一键部署

```bash
# 运行部署脚本
bash deploy.sh
```

脚本会自动：
- ✅ 检查Docker环境
- ✅ 验证配置
- ✅ 构建Docker镜像
- ✅ 启动服务
- ✅ 显示访问地址

#### 6. 访问监控系统

部署完成后，在浏览器访问：

```
http://192.168.100.221:3000
```

---

### 方案二：使用飞牛OS Docker管理界面

#### 1. 准备文件

按照方案一的步骤1-4，将代码克隆到NAS并配置好`.env`文件。

#### 2. 使用飞牛OS Docker管理

1. 登录飞牛OS管理界面
2. 进入"Docker"应用
3. 选择"容器"标签
4. 点击"添加容器"

**容器配置**：

- **镜像名称**: `jarvis-network-monitor`（需要先构建）
- **端口映射**: `3000:3000`
- **网络模式**: `host`（重要！用于访问路由器）
- **自动重启**: 启用
- **卷映射**: 
  - `/path/to/jarvis-monitor:/app`
  - `/path/to/jarvis-monitor/data:/app/data`

#### 3. 构建镜像

在SSH终端中：

```bash
cd /volume1/docker/jarvis-monitor
docker build -t jarvis-network-monitor .
```

#### 4. 启动容器

在飞牛OS Docker管理界面启动刚创建的容器。

---

## 🔧 高级配置

### 使用外部MySQL数据库

如果您的飞牛OS已经运行MySQL，可以使用它：

```env
DATABASE_URL="mysql://username:password@localhost:3306/jarvis_monitor"
```

首先创建数据库：

```bash
# 连接到MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE jarvis_monitor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建用户（可选）
CREATE USER 'jarvis'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON jarvis_monitor.* TO 'jarvis'@'localhost';
FLUSH PRIVILEGES;
```

### 设置开机自启动

Docker容器已配置`restart: unless-stopped`，会自动随系统启动。

如果需要手动配置：

```bash
# 编辑docker-compose.yml
nano docker-compose.yml

# 确保包含以下配置
services:
  jarvis-monitor:
    restart: unless-stopped
```

### 配置反向代理（可选）

如果您的飞牛OS运行了Nginx，可以配置反向代理：

```nginx
server {
    listen 80;
    server_name monitor.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📊 验证部署

### 1. 检查容器状态

```bash
cd /volume1/docker/jarvis-monitor
docker-compose ps
```

应该看到容器状态为`Up`。

### 2. 查看日志

```bash
docker-compose logs -f
```

正常情况下应该看到：
- ✅ 数据库连接成功
- ✅ 路由器连接成功
- ✅ 数据收集服务启动
- ✅ 服务器运行在端口3000

### 3. 测试路由器连接

```bash
# 从NAS ping路由器
ping 192.168.100.1
```

应该能正常ping通。

### 4. 访问监控界面

在浏览器打开 `http://192.168.100.221:3000`，应该能看到：
- ✅ 贾维斯风格界面
- ✅ 实时网络流量数据
- ✅ 在线设备列表
- ✅ 路由器状态信息

---

## 🔍 故障排查

### 问题1: 容器无法启动

**检查日志**：
```bash
docker-compose logs
```

**常见原因**：
- 端口3000被占用 → 修改`.env`中的`PORT`
- 权限问题 → 使用`sudo`运行命令
- 内存不足 → 检查NAS资源使用情况

### 问题2: 无法连接路由器

**症状**: 网络流量显示0，设备列表为空

**解决方案**：
1. 检查网络模式是否为`host`
2. 在容器内测试连接：
   ```bash
   docker exec -it jarvis-network-monitor sh
   ping 192.168.100.1
   ```
3. 检查路由器密码是否正确
4. 确认路由器启用了SSH访问

### 问题3: 数据库连接失败

**使用SQLite**：
```bash
# 检查数据目录权限
ls -la data/
chmod 755 data/
```

**使用MySQL**：
```bash
# 测试MySQL连接
mysql -h localhost -u jarvis -p
```

### 问题4: 端口冲突

**修改端口**：
```bash
# 编辑.env
nano .env

# 修改PORT
PORT=3001

# 重启容器
docker-compose restart
```

---

## 🔄 日常维护

### 查看日志
```bash
cd /volume1/docker/jarvis-monitor
docker-compose logs -f
```

### 重启服务
```bash
docker-compose restart
```

### 停止服务
```bash
docker-compose stop
```

### 启动服务
```bash
docker-compose start
```

### 更新代码
```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build
```

### 备份数据
```bash
# 备份SQLite数据库
cp data/network_monitor.db data/network_monitor.db.backup

# 或备份整个data目录
tar -czf jarvis-backup-$(date +%Y%m%d).tar.gz data/
```

### 清理旧容器和镜像
```bash
# 停止并删除容器
docker-compose down

# 清理未使用的镜像
docker image prune -a
```

---

## 📱 移动端访问

在同一局域网内的任何设备上访问：

```
http://192.168.100.221:3000
```

**添加到手机主屏幕**：

**iOS (Safari)**:
1. 访问监控地址
2. 点击分享按钮
3. 选择"添加到主屏幕"

**Android (Chrome)**:
1. 访问监控地址
2. 点击菜单（三个点）
3. 选择"添加到主屏幕"

---

## 🔒 安全建议

1. **修改默认密码**
   - 确保路由器使用强密码
   - 定期更换JWT_SECRET

2. **限制访问**
   - 在飞牛OS防火墙中限制3000端口访问
   - 只允许信任的设备访问

3. **定期备份**
   - 每周备份数据库
   - 保存配置文件

4. **监控资源**
   - 定期检查NAS资源使用情况
   - 监控容器内存和CPU使用

---

## 🆘 获取帮助

### 查看容器详细信息
```bash
docker inspect jarvis-network-monitor
```

### 进入容器调试
```bash
docker exec -it jarvis-network-monitor sh
```

### 检查网络连接
```bash
# 在容器内
ping 192.168.100.1
curl http://192.168.100.1
```

### 查看系统资源
```bash
# NAS资源使用
top
df -h

# Docker资源使用
docker stats
```

---

## 🎉 部署完成！

现在您可以在大屏幕上全屏显示监控系统，实时查看家庭网络的所有状态！

**访问地址**: `http://192.168.100.221:3000`

**建议**：
- 将地址添加到浏览器书签
- 在大屏幕上全屏显示（F11）
- 设置显示器不休眠

享受您的贾维斯风格网络监控系统！ 🚀
