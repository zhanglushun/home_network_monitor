# 贾维斯智能监控系统 - FN OS NAS 部署指南

## 🎯 快速部署（5分钟）

### 步骤1：SSH连接到NAS

```bash
ssh zhanglushun@192.168.100.221
```

### 步骤2：下载代码

```bash
# 从GitHub克隆（如果已同步到GitHub）
cd ~
git clone <your-github-repo-url> jarvis-monitor
cd jarvis-monitor/python_backend

# 或者从Manus下载
# 在Manus管理界面点击"Code" -> "Download All Files"
# 然后上传到NAS
```

### 步骤3：配置环境变量

```bash
# 使用预配置的文件
cp .env.nas .env

# 或手动编辑
nano .env
```

确认以下配置：
```env
DATABASE_URL=sqlite:///./data/network_monitor.db
PORT=3000
ROUTER_URL=http://192.168.100.1
ROUTER_USERNAME=root
ROUTER_PASSWORD=password
```

### 步骤4：一键部署

```bash
chmod +x deploy_to_nas.sh
bash deploy_to_nas.sh
```

### 步骤5：验证部署

```bash
# 检查服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 健康检查
curl http://localhost:3000/health
```

### 步骤6：访问应用

在浏览器打开：
```
http://192.168.100.221:3000
```

---

## 📊 验证数据采集

### 查看实时日志

```bash
docker-compose logs -f jarvis-monitor-python
```

应该看到类似输出：
```
INFO - 网络流量数据已保存: 上传=123.45 KB/s, 下载=567.89 KB/s
INFO - 在线设备数据已更新: 5台设备
INFO - 路由器状态已保存: CPU=25.3%, 内存=45.2%
```

### 测试API接口

```bash
# 获取仪表板数据
curl http://localhost:3000/api/dashboard/overview | jq

# 获取历史数据
curl http://localhost:3000/api/dashboard/historical?hours=24 | jq

# 获取设备列表
curl http://localhost:3000/api/devices | jq
```

---

## 🔧 常用管理命令

### 服务管理

```bash
# 查看服务状态
docker-compose ps

# 启动服务
docker-compose start

# 停止服务
docker-compose stop

# 重启服务
docker-compose restart

# 删除服务（保留数据）
docker-compose down

# 删除服务和数据
docker-compose down -v
```

### 日志管理

```bash
# 实时查看日志
docker-compose logs -f

# 查看最近100行日志
docker-compose logs --tail=100

# 查看特定服务日志
docker-compose logs -f jarvis-monitor-python
```

### 数据管理

```bash
# 查看数据库文件
ls -lh data/network_monitor.db

# 备份数据库
cp data/network_monitor.db data/network_monitor_backup_$(date +%Y%m%d).db

# 清空数据库（重新开始）
rm data/network_monitor.db
docker-compose restart
```

---

## 🐛 故障排查

### 问题1：容器无法启动

**检查日志**：
```bash
docker-compose logs jarvis-monitor-python
```

**常见原因**：
- 端口3000被占用
- 环境变量配置错误
- Docker资源不足

**解决方案**：
```bash
# 检查端口占用
sudo lsof -i :3000

# 修改端口（编辑.env文件）
PORT=3001

# 重新部署
docker-compose down
docker-compose up -d
```

### 问题2：无法连接路由器

**症状**：
```
ERROR - iStoreOS登录失败
```

**检查步骤**：
```bash
# 1. 测试网络连通性
ping 192.168.100.1

# 2. 测试路由器Web界面
curl http://192.168.100.1

# 3. 检查路由器密码
# 编辑.env文件，确认ROUTER_PASSWORD正确
```

### 问题3：数据不更新

**检查数据采集服务**：
```bash
# 查看日志，确认有数据采集记录
docker-compose logs -f | grep "已保存"

# 检查数据库文件大小
ls -lh data/network_monitor.db

# 进入容器检查
docker-compose exec jarvis-monitor-python python3 -c "from models.database import init_db; init_db(); print('数据库初始化成功')"
```

### 问题4：前端无法加载

**检查前端文件**：
```bash
# 前端文件应该在上级目录
ls -la ../client/dist/

# 如果没有，需要构建前端
cd ../client
pnpm install
pnpm build
```

---

## 🔄 更新部署

### 从GitHub拉取最新代码

```bash
cd ~/jarvis-monitor
git pull
cd python_backend
docker-compose down
docker-compose build
docker-compose up -d
```

### 查看更新日志

```bash
docker-compose logs -f
```

---

## 📈 性能优化

### 调整数据采集频率

编辑 `services/data_collector.py`：

```python
# 网络流量: 5秒 → 10秒
self.scheduler.add_job(
    self.collect_network_traffic,
    'interval',
    seconds=10,  # 原来是5
    id='collect_network_traffic'
)
```

重新构建：
```bash
docker-compose down
docker-compose build
docker-compose up -d
```

### 切换到MySQL数据库

```bash
# 1. 安装MySQL/MariaDB
sudo apt-get install mariadb-server

# 2. 创建数据库
mysql -u root -p
CREATE DATABASE network_monitor;
CREATE USER 'jarvis'@'%' IDENTIFIED BY 'jarvis123';
GRANT ALL PRIVILEGES ON network_monitor.* TO 'jarvis'@'%';
FLUSH PRIVILEGES;
EXIT;

# 3. 修改.env
DATABASE_URL=mysql+pymysql://jarvis:jarvis123@localhost:3306/network_monitor

# 4. 重启服务
docker-compose restart
```

---

## 🔐 安全建议

1. **修改默认密码**：
   - 修改.env中的ROUTER_PASSWORD
   - 使用强密码

2. **限制访问**：
   ```bash
   # 只允许本地访问（修改docker-compose.yml）
   ports:
     - "127.0.0.1:3000:3000"
   ```

3. **定期备份**：
   ```bash
   # 创建备份脚本
   cat > backup.sh << 'EOF'
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   cp data/network_monitor.db backups/network_monitor_$DATE.db
   # 保留最近7天的备份
   find backups/ -name "*.db" -mtime +7 -delete
   EOF
   
   chmod +x backup.sh
   
   # 添加到crontab（每天凌晨2点备份）
   crontab -e
   0 2 * * * /home/zhanglushun/jarvis-monitor/python_backend/backup.sh
   ```

---

## 📞 获取帮助

### 查看完整文档

```bash
cat README.md
cat PYTHON_DEPLOYMENT.md
```

### 检查系统状态

```bash
# 系统资源
docker stats

# 磁盘空间
df -h

# 内存使用
free -h

# Docker信息
docker info
```

---

## ✅ 部署检查清单

- [ ] SSH连接到NAS成功
- [ ] Docker已安装并运行
- [ ] 代码已下载到NAS
- [ ] .env文件已配置
- [ ] 部署脚本已执行
- [ ] 容器状态为running
- [ ] 健康检查返回OK
- [ ] 可以访问http://192.168.100.221:3000
- [ ] 日志显示数据正在采集
- [ ] API接口返回正常数据

---

**部署完成后，您将拥有一个运行在FN OS NAS上的贾维斯风格网络监控系统！** 🎉
