# 贾维斯网络监控系统 - 本地部署指南

## 📋 系统要求

### 硬件要求
- **部署设备**：能够24小时运行的设备（推荐使用树莓派、NAS、或小型服务器）
- **网络要求**：设备必须在与iStoreOS软路由相同的局域网内
- **存储空间**：至少1GB可用空间
- **内存**：至少512MB可用内存

### 软件要求
- **Node.js**：v18.0.0 或更高版本
- **pnpm**：v8.0.0 或更高版本
- **数据库**：MySQL 8.0+ 或 TiDB（已包含在环境变量中）

## 🚀 快速部署步骤

### 1. 导出代码

在Manus管理界面中：
1. 点击右上角的"设置"图标
2. 选择"GitHub"选项卡
3. 点击"导出到GitHub"按钮
4. 选择或创建一个GitHub仓库
5. 等待导出完成

### 2. 克隆代码到本地设备

在您的本地网络设备上（例如树莓派、NAS等）：

```bash
# 克隆代码
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

# 安装依赖
pnpm install
```

### 3. 配置环境变量

创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下关键变量：

```env
# 数据库连接（从Manus复制或使用本地数据库）
DATABASE_URL="mysql://user:password@localhost:3306/network_monitor"

# JWT密钥（用于会话管理）
JWT_SECRET="your-secret-key-here"

# iStoreOS路由器配置
ISTOREOS_HOST="192.168.100.1"
ISTOREOS_USERNAME="root"
ISTOREOS_PASSWORD="your-router-password"

# 应用配置
NODE_ENV="production"
PORT=3000
```

### 4. 初始化数据库

```bash
# 推送数据库架构
pnpm db:push
```

### 5. 构建和启动应用

```bash
# 构建前端
cd client
pnpm build
cd ..

# 启动应用
pnpm start
```

### 6. 设置开机自启动（可选但推荐）

#### 使用 systemd（Linux系统）

创建服务文件 `/etc/systemd/system/jarvis-monitor.service`：

```ini
[Unit]
Description=JARVIS Network Monitor
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/path/to/your/project
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启用并启动服务：

```bash
sudo systemctl enable jarvis-monitor
sudo systemctl start jarvis-monitor
sudo systemctl status jarvis-monitor
```

#### 使用 PM2（跨平台）

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start pnpm --name "jarvis-monitor" -- start

# 设置开机自启动
pm2 startup
pm2 save
```

## 🔧 配置iStoreOS路由器

### 1. 确认路由器可访问

```bash
# 测试连接
ping 192.168.100.1

# 测试SSH连接（如果启用）
ssh root@192.168.100.1
```

### 2. 启用iStoreOS API访问

登录iStoreOS管理界面（http://192.168.100.1）：

1. 进入"系统" → "管理权限"
2. 确保"启用SSH访问"已开启
3. 确保"启用Web API"已开启（如果有此选项）
4. 记录登录用户名和密码

### 3. 配置防火墙（如果需要）

如果您的路由器启用了防火墙，需要允许监控设备访问：

1. 进入"网络" → "防火墙"
2. 添加规则允许监控设备的IP访问路由器管理端口

## 🌐 访问监控系统

部署完成后，在浏览器中访问：

```
http://YOUR_DEVICE_IP:3000
```

例如：
- 如果部署在树莓派（IP: 192.168.100.50）：`http://192.168.100.50:3000`
- 如果部署在NAS（IP: 192.168.100.100）：`http://192.168.100.100:3000`

## 📊 验证数据收集

访问监控系统后，您应该能看到：

1. ✅ 实时网络流量（上传/下载速度）
2. ✅ 在线设备列表（实时更新）
3. ✅ 网络延迟监控（Ping测试）
4. ✅ 路由器状态（CPU、内存、温度）
5. ✅ 连接质量指标
6. ✅ 历史趋势图表（运行一段时间后）

## 🔍 故障排查

### 问题1：无法连接到路由器

**症状**：网络流量显示0，设备列表为空

**解决方案**：
1. 检查路由器IP地址是否正确（`ping 192.168.100.1`）
2. 检查路由器用户名和密码是否正确
3. 检查路由器是否启用了SSH/API访问
4. 查看应用日志：`pnpm logs` 或 `pm2 logs jarvis-monitor`

### 问题2：数据库连接失败

**症状**：应用启动失败，提示数据库错误

**解决方案**：
1. 检查 `.env` 中的 `DATABASE_URL` 是否正确
2. 确保数据库服务正在运行
3. 运行 `pnpm db:push` 初始化数据库

### 问题3：端口被占用

**症状**：启动时提示 "Port 3000 is already in use"

**解决方案**：
1. 修改 `.env` 中的 `PORT` 变量
2. 或者停止占用端口的进程：`lsof -ti:3000 | xargs kill -9`

### 问题4：历史数据不显示

**症状**：历史趋势图表显示"正在加载历史数据..."

**原因**：系统刚启动，还没有足够的历史数据

**解决方案**：等待系统运行一段时间（至少1小时）后，历史数据会自动显示

## 📱 移动端访问

在同一局域网内的任何设备（手机、平板）上，都可以通过浏览器访问监控系统：

```
http://YOUR_DEVICE_IP:3000
```

建议将此地址添加到浏览器书签或手机主屏幕，方便随时查看。

## 🔒 安全建议

1. **修改默认密码**：确保路由器使用强密码
2. **限制访问**：在路由器防火墙中限制只有信任的设备可以访问
3. **定期更新**：定期从GitHub拉取最新代码更新
4. **备份数据**：定期备份数据库数据

## 🆘 需要帮助？

如果遇到问题，请检查：

1. **应用日志**：
   ```bash
   # 如果使用pnpm
   pnpm logs
   
   # 如果使用PM2
   pm2 logs jarvis-monitor
   ```

2. **数据库状态**：
   ```bash
   pnpm db:studio
   ```

3. **系统资源**：
   ```bash
   top
   df -h
   ```

## 🎉 部署完成！

现在您可以在大屏幕上全屏显示监控系统，实时查看家庭网络的所有状态！

享受您的贾维斯风格网络监控系统！ 🚀
