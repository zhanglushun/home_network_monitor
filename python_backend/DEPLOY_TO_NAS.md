# 飞牛OS NAS部署指南 - 真实路由器数据版本

## 版本说明

本版本已完成iStoreOS路由器真实数据对接，将从路由器获取真实的网络流量、设备列表、系统状态等数据。

## 部署前准备

### 1. 确认网络环境
- 飞牛OS NAS IP: 192.168.100.221
- iStoreOS路由器 IP: 192.168.100.1
- 两者必须在同一局域网内

### 2. 确认路由器凭据
- 用户名: root
- 密码: password（请根据实际情况修改）

### 3. 准备SSH访问
```bash
ssh root@192.168.100.221
# 或使用飞牛OS的用户名
```

## 快速部署步骤

### 方法1: 使用GitHub同步（推荐）

#### 步骤1: 在Manus中同步到GitHub
1. 在Manus管理界面点击"保存检查点"
2. 代码会自动同步到您的GitHub仓库

#### 步骤2: 在NAS上克隆/更新代码
```bash
# SSH连接到NAS
ssh root@192.168.100.221

# 如果是首次部署
cd /root
git clone https://github.com/YOUR_USERNAME/home_network_monitor.git
cd home_network_monitor/python_backend

# 如果已经部署过，只需更新
cd /root/home_network_monitor
git pull origin main
cd python_backend
```

#### 步骤3: 配置环境变量
```bash
# 编辑.env文件
nano .env

# 确保包含以下配置
ROUTER_URL=http://192.168.100.1
ROUTER_USERNAME=root
ROUTER_PASSWORD=password
DATABASE_URL=sqlite:///./data/network_monitor.db
```

#### 步骤4: 停止旧容器并重新构建
```bash
# 停止并删除旧容器
docker-compose down

# 重新构建镜像（包含最新代码）
docker-compose build --no-cache

# 启动新容器
docker-compose up -d
```

#### 步骤5: 验证部署
```bash
# 查看容器状态
docker-compose ps

# 查看日志，确认是否成功连接路由器
docker-compose logs -f --tail=100

# 应该看到类似以下日志：
# [iStoreOS] 登录成功，token: xxxxx...
# [iStoreOS] 获取到 20 台在线设备
```

### 方法2: 手动上传代码

#### 步骤1: 打包代码
在本地电脑上：
```bash
# 下载代码到本地
# 然后打包python_backend目录
cd home_network_monitor
tar -czf python_backend.tar.gz python_backend/
```

#### 步骤2: 上传到NAS
```bash
# 使用scp上传
scp python_backend.tar.gz root@192.168.100.221:/root/

# 或使用飞牛OS的文件管理界面上传
```

#### 步骤3: 在NAS上解压和部署
```bash
# SSH连接到NAS
ssh root@192.168.100.221

# 解压代码
cd /root
tar -xzf python_backend.tar.gz
cd python_backend

# 配置环境变量（同方法1的步骤3）
# 部署（同方法1的步骤4-5）
```

## 验证数据采集

### 1. 检查日志
```bash
docker-compose logs -f
```

**成功的日志示例：**
```
[2026-01-18 15:20:00] [iStoreOS] 登录成功，token: a1b2c3d4e5f6...
[2026-01-18 15:20:01] [iStoreOS] 获取到 20 台在线设备
[2026-01-18 15:20:02] [INFO] 网络流量数据已保存
[2026-01-18 15:20:02] [INFO] 在线设备数据已保存
```

**失败的日志示例：**
```
[2026-01-18 15:20:00] [iStoreOS] 登录异常: timeout of 10000ms exceeded
[2026-01-18 15:20:01] [iStoreOS] 无法读取/proc/net/dev，使用模拟数据
```

如果看到失败日志，请检查：
- NAS能否ping通路由器: `ping 192.168.100.1`
- 路由器用户名密码是否正确
- 路由器的LuCI Web界面是否可访问

### 2. 访问前端界面
在浏览器中打开：
```
http://192.168.100.221:3001
```

应该能看到：
- 真实的在线设备数量（不再是固定的5台）
- 真实的网络流量数据（会随实际使用变化）
- 真实的路由器CPU、内存使用率
- 真实的网络延迟数据

### 3. 检查数据库
```bash
# 进入容器
docker-compose exec app bash

# 查看数据库
sqlite3 /app/data/network_monitor.db

# 查询最新的网络流量数据
SELECT * FROM network_traffic ORDER BY timestamp DESC LIMIT 5;

# 查询在线设备
SELECT * FROM online_devices ORDER BY last_seen DESC LIMIT 10;

# 退出
.exit
exit
```

## 故障排查

### 问题1: 无法连接路由器
**症状**: 日志显示"登录异常: timeout"

**解决方法**:
```bash
# 在NAS上测试网络连接
ping 192.168.100.1

# 测试路由器Web界面
curl -I http://192.168.100.1

# 检查Docker网络模式
docker-compose exec app ping 192.168.100.1
```

如果容器内无法ping通路由器，检查docker-compose.yml中的网络配置：
```yaml
network_mode: "host"  # 确保使用host网络模式
```

### 问题2: 认证失败
**症状**: 日志显示"登录失败"

**解决方法**:
1. 在浏览器中访问 http://192.168.100.1 确认用户名密码
2. 检查.env文件中的ROUTER_USERNAME和ROUTER_PASSWORD
3. 重启容器: `docker-compose restart`

### 问题3: 数据仍然是模拟的
**症状**: 设备数量固定为2台，流量数据随机变化

**解决方法**:
1. 检查日志是否有"使用模拟数据"的警告
2. 确认路由器上已安装luci-mod-rpc:
   ```bash
   # SSH到路由器
   ssh root@192.168.100.1
   opkg list-installed | grep luci-mod-rpc
   
   # 如果没有安装
   opkg update
   opkg install luci-mod-rpc
   ```
3. 重启Python后端容器

### 问题4: 容器启动失败
**症状**: `docker-compose ps` 显示容器状态为Exit

**解决方法**:
```bash
# 查看详细错误信息
docker-compose logs

# 常见问题：
# 1. 端口被占用 -> 修改docker-compose.yml中的端口
# 2. 权限问题 -> 检查data目录权限
# 3. 依赖缺失 -> 重新构建镜像
```

## 性能优化

### 1. 调整数据采集频率
编辑 `services/data_collector.py`，修改定时任务间隔：
```python
# 网络流量（默认5秒）
@self.scheduler.scheduled_job('interval', seconds=5)

# 可以改为10秒以减少负载
@self.scheduler.scheduled_job('interval', seconds=10)
```

### 2. 数据库清理
默认保留7天数据，可以修改清理策略：
```python
# 在data_collector.py中
# 修改清理时间（默认7天）
cutoff_time = datetime.now() - timedelta(days=7)
```

### 3. 日志级别
在.env中添加：
```bash
LOG_LEVEL=INFO  # 可选: DEBUG, INFO, WARNING, ERROR
```

## 开机自启动

确保Docker服务开机自启动：
```bash
# 在飞牛OS上
systemctl enable docker
systemctl enable docker-compose@home_network_monitor
```

## 更新代码

当有新版本时：
```bash
cd /root/home_network_monitor
git pull origin main
cd python_backend
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 备份数据

### 备份数据库
```bash
# 创建备份目录
mkdir -p /root/backups

# 备份数据库
docker-compose exec app sqlite3 /app/data/network_monitor.db ".backup '/app/data/backup.db'"
cp /root/home_network_monitor/python_backend/data/backup.db /root/backups/network_monitor_$(date +%Y%m%d).db
```

### 恢复数据库
```bash
cp /root/backups/network_monitor_20260118.db /root/home_network_monitor/python_backend/data/network_monitor.db
docker-compose restart
```

## 监控和维护

### 定期检查
```bash
# 每周检查一次容器状态
docker-compose ps

# 查看磁盘使用
du -sh /root/home_network_monitor/python_backend/data/

# 查看日志大小
docker-compose logs --tail=1000 | wc -l
```

### 日志轮转
Docker会自动管理日志，但可以手动清理：
```bash
docker-compose logs --tail=0 > /dev/null
```

## 技术支持

如果遇到问题：
1. 查看日志: `docker-compose logs -f`
2. 检查API对接文档: `cat API_INTEGRATION.md`
3. 测试路由器连接: `curl http://192.168.100.1`

## 下一步改进

- [ ] 实现单设备流量统计（需要配置nftables）
- [ ] 添加告警功能（流量超限、设备上线/下线）
- [ ] 支持多个路由器监控
- [ ] 添加数据导出功能（CSV、JSON）
- [ ] 实现Web配置界面
