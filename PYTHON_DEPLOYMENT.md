# 贾维斯智能监控系统 - Python后端部署指南

> **重要说明**: 由于Node.js 18在飞牛OS NAS上存在server.listen()兼容性问题，我们将后端完全重写为Python + FastAPI，前端保持不变。

---

## 📋 目录

1. [系统要求](#系统要求)
2. [快速部署（Docker）](#快速部署docker)
3. [手动部署](#手动部署)
4. [配置说明](#配置说明)
5. [验证测试](#验证测试)
6. [故障排查](#故障排查)

---

## 系统要求

### 硬件要求
- **CPU**: 双核及以上
- **内存**: 1GB及以上
- **存储**: 10GB可用空间
- **网络**: 与iStoreOS路由器在同一局域网

### 软件要求
- **操作系统**: Linux (Debian/Ubuntu/飞牛OS)
- **Python**: 3.9+
- **数据库**: MySQL 5.7+ 或 MariaDB 10.3+
- **Docker**: 20.10+ (可选，推荐)

---

## 快速部署（Docker）

### 1. 克隆代码

```bash
cd ~
git clone <your-repo-url> jarvis-monitor
cd jarvis-monitor/python_backend
```

### 2. 配置环境变量

```bash
cp .env.template .env
nano .env
```

**必填配置**:
```env
DATABASE_URL=mysql+pymysql://用户名:密码@数据库地址:3306/数据库名
ROUTER_URL=http://192.168.100.1
ROUTER_USERNAME=root
ROUTER_PASSWORD=你的路由器密码
```

### 3. 启动服务

```bash
docker-compose up -d
```

### 4. 查看日志

```bash
docker-compose logs -f
```

### 5. 访问应用

```
http://你的NAS地址:3000
```

---

## 手动部署

### 1. 安装Python依赖

```bash
cd ~/jarvis-monitor/python_backend

# 安装系统依赖
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-dev \
    gcc default-libmysqlclient-dev pkg-config

# 安装Python包
pip3 install -r requirements.txt
```

### 2. 配置数据库

```bash
# 登录MySQL
mysql -u root -p

# 创建数据库和用户
CREATE DATABASE network_monitor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'jarvis'@'localhost' IDENTIFIED BY 'jarvis123';
GRANT ALL PRIVILEGES ON network_monitor.* TO 'jarvis'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. 配置环境变量

```bash
cp .env.template .env
nano .env
```

### 4. 启动服务

```bash
bash start.sh
```

### 5. 后台运行（使用systemd）

创建服务文件:
```bash
sudo nano /etc/systemd/system/jarvis-monitor.service
```

内容:
```ini
[Unit]
Description=Jarvis Network Monitor (Python)
After=network.target mysql.service

[Service]
Type=simple
User=你的用户名
WorkingDirectory=/home/你的用户名/jarvis-monitor/python_backend
ExecStart=/usr/bin/python3 main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启用服务:
```bash
sudo systemctl daemon-reload
sudo systemctl enable jarvis-monitor
sudo systemctl start jarvis-monitor
sudo systemctl status jarvis-monitor
```

---

## 配置说明

### 环境变量详解

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `DATABASE_URL` | ✅ | - | MySQL连接字符串 |
| `PORT` | ❌ | 3000 | 服务端口 |
| `NODE_ENV` | ❌ | production | 运行环境 |
| `ROUTER_URL` | ✅ | - | 路由器地址 |
| `ROUTER_USERNAME` | ✅ | root | 路由器用户名 |
| `ROUTER_PASSWORD` | ✅ | - | 路由器密码 |
| `DATA_RETENTION_DAYS` | ❌ | 7 | 数据保留天数 |

### 数据库连接字符串格式

```
mysql+pymysql://用户名:密码@主机:端口/数据库名
```

示例:
```
mysql+pymysql://jarvis:jarvis123@127.0.0.1:3306/network_monitor
```

---

## 验证测试

### 1. 健康检查

```bash
curl http://localhost:3000/health
```

期望输出:
```json
{
  "status": "ok",
  "message": "贾维斯智能监控系统运行正常",
  "collector_running": true
}
```

### 2. API文档

访问: `http://你的NAS地址:3000/docs`

FastAPI自动生成的交互式API文档。

### 3. 测试数据采集

```bash
# 查看日志
docker-compose logs -f

# 或手动运行时
tail -f logs/jarvis.log
```

应该看到类似输出:
```
2024-01-17 16:30:05 - data_collector - INFO - 网络流量数据已保存: 上传=123.45 KB/s, 下载=567.89 KB/s
2024-01-17 16:30:10 - data_collector - INFO - 在线设备数据已更新: 5台设备
```

### 4. 测试API接口

```bash
# 获取仪表板数据
curl http://localhost:3000/api/dashboard/overview

# 获取历史数据
curl http://localhost:3000/api/dashboard/historical?hours=24

# 获取设备列表
curl http://localhost:3000/api/devices
```

---

## 故障排查

### 问题1: 无法连接数据库

**症状**:
```
sqlalchemy.exc.OperationalError: (pymysql.err.OperationalError) (2003, "Can't connect to MySQL server")
```

**解决方案**:
1. 检查MySQL服务是否运行: `sudo systemctl status mysql`
2. 检查DATABASE_URL配置是否正确
3. 检查数据库用户权限: `SHOW GRANTS FOR 'jarvis'@'localhost';`
4. 测试连接: `mysql -u jarvis -p network_monitor`

### 问题2: 无法访问路由器

**症状**:
```
ERROR - iStoreOS登录失败
```

**解决方案**:
1. 检查路由器地址是否正确: `ping 192.168.100.1`
2. 检查路由器用户名和密码
3. 确认NAS与路由器在同一局域网
4. 检查路由器是否开启SSH/API访问

### 问题3: 端口已被占用

**症状**:
```
OSError: [Errno 98] Address already in use
```

**解决方案**:
1. 查找占用端口的进程: `sudo lsof -i :3000`
2. 停止旧进程: `sudo kill -9 <PID>`
3. 或修改PORT环境变量使用其他端口

### 问题4: Python依赖安装失败

**症状**:
```
error: command 'gcc' failed
```

**解决方案**:
```bash
# 安装编译工具
sudo apt-get install -y build-essential python3-dev \
    default-libmysqlclient-dev pkg-config
```

### 问题5: 数据收集服务未启动

**症状**:
```json
{"collector_running": false}
```

**解决方案**:
1. 查看日志: `docker-compose logs -f`
2. 检查路由器连接
3. 手动重启服务: `docker-compose restart`

---

## 性能优化

### 1. 数据库索引

```sql
-- 为常用查询字段添加索引
CREATE INDEX idx_timestamp ON network_traffic(timestamp);
CREATE INDEX idx_mac ON online_devices(mac_address);
CREATE INDEX idx_online ON online_devices(is_online);
```

### 2. 调整采集频率

编辑 `services/data_collector.py`:
```python
# 网络流量: 5秒 → 10秒
self.scheduler.add_job(
    self.collect_network_traffic,
    'interval',
    seconds=10,  # 原来是5
    id='collect_network_traffic'
)
```

### 3. 数据库连接池

编辑 `models/database.py`:
```python
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=10,        # 增加连接池大小
    max_overflow=20      # 增加最大溢出连接
)
```

---

## 开机自启动

### Docker方式

```bash
# 设置Docker服务开机启动
sudo systemctl enable docker

# 容器已配置restart: unless-stopped
# 会随Docker服务自动启动
```

### Systemd方式

参见 [手动部署 - 步骤5](#5-后台运行使用systemd)

---

## 日常维护

### 查看日志

```bash
# Docker方式
docker-compose logs -f

# Systemd方式
sudo journalctl -u jarvis-monitor -f
```

### 备份数据库

```bash
mysqldump -u jarvis -p network_monitor > backup_$(date +%Y%m%d).sql
```

### 更新代码

```bash
cd ~/jarvis-monitor
git pull
cd python_backend
docker-compose down
docker-compose build
docker-compose up -d
```

---

## 技术架构

```
┌─────────────────────────────────────────┐
│         React前端 (保持不变)              │
│     贾维斯风格界面 + 实时数据展示          │
└─────────────────┬───────────────────────┘
                  │ HTTP/REST API
┌─────────────────▼───────────────────────┐
│      Python FastAPI后端 (新)             │
│  - FastAPI框架                           │
│  - SQLAlchemy ORM                        │
│  - APScheduler定时任务                   │
│  - Httpx异步HTTP客户端                   │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌──────▼──────────┐
│  MySQL数据库    │  │ iStoreOS路由器   │
│  - 7张监控表    │  │ - 网络流量       │
│  - 7天历史数据  │  │ - 设备信息       │
└────────────────┘  │ - 系统状态       │
                    └─────────────────┘
```

---

## 与Node.js版本的区别

| 特性 | Node.js版本 | Python版本 |
|------|------------|-----------|
| 后端框架 | Express + tRPC | FastAPI |
| ORM | Drizzle | SQLAlchemy |
| 定时任务 | node-cron | APScheduler |
| HTTP客户端 | axios | httpx |
| 端口绑定 | ❌ 失败 | ✅ 成功 |
| 前端 | React | React (相同) |
| 数据库 | MySQL | MySQL (相同) |
| 界面风格 | 贾维斯 | 贾维斯 (相同) |

---

## 支持

如有问题，请检查:
1. 日志文件
2. 数据库连接
3. 路由器连接
4. 网络配置

---

**部署完成后，访问 `http://你的NAS地址:3000` 即可看到贾维斯风格的监控界面！** 🎉
