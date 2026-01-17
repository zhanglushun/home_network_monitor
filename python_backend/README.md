# 贾维斯智能监控系统 - Python后端

> FastAPI + SQLAlchemy + APScheduler 实现的网络监控后端服务

---

## 🚀 快速开始

### Docker部署（推荐）

```bash
# 1. 配置环境变量
cp .env.template .env
nano .env

# 2. 启动服务
docker-compose up -d

# 3. 查看日志
docker-compose logs -f

# 4. 访问应用
# http://你的服务器地址:3000
```

### 手动部署

```bash
# 1. 安装依赖
pip3 install -r requirements.txt

# 2. 配置环境变量
cp .env.template .env
nano .env

# 3. 启动服务
bash start.sh
```

---

## 📁 项目结构

```
python_backend/
├── main.py                    # FastAPI主应用
├── requirements.txt           # Python依赖
├── .env.template             # 环境变量模板
├── start.sh                  # 启动脚本
├── Dockerfile                # Docker镜像
├── docker-compose.yml        # Docker编排
├── models/
│   └── database.py           # SQLAlchemy数据库模型
├── api/
│   └── __init__.py           # API路由
├── services/
│   └── data_collector.py     # 数据收集服务
└── utils/
    └── istoreos_client.py    # iStoreOS API客户端
```

---

## 🔧 配置说明

### 环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `DATABASE_URL` | ✅ | MySQL连接字符串 |
| `PORT` | ❌ | 服务端口（默认3000） |
| `ROUTER_URL` | ✅ | 路由器地址 |
| `ROUTER_USERNAME` | ✅ | 路由器用户名 |
| `ROUTER_PASSWORD` | ✅ | 路由器密码 |
| `DATA_RETENTION_DAYS` | ❌ | 数据保留天数（默认7） |

### 数据库连接

```env
DATABASE_URL=mysql+pymysql://用户名:密码@主机:端口/数据库名
```

---

## 📊 API接口

### 健康检查

```bash
GET /health
```

### 仪表板概览

```bash
GET /api/dashboard/overview
```

返回:
- 最新网络流量
- 在线设备列表
- 网络延迟数据
- 路由器状态
- 连接质量

### 历史数据

```bash
GET /api/dashboard/historical?hours=24
```

返回24小时内的历史数据。

### 设备列表

```bash
GET /api/devices
```

返回所有设备信息。

### API文档

访问 `http://服务器地址:3000/docs` 查看完整的交互式API文档。

---

## 🗄️ 数据库表结构

### network_traffic - 网络流量

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| timestamp | DateTime | 时间戳 |
| upload_speed | Float | 上传速度 (KB/s) |
| download_speed | Float | 下载速度 (KB/s) |
| total_upload | Float | 总上传量 (KB) |
| total_download | Float | 总下载量 (KB) |

### online_devices - 在线设备

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| mac_address | String(17) | MAC地址 |
| ip_address | String(15) | IP地址 |
| hostname | String(255) | 主机名 |
| device_type | String(50) | 设备类型 |
| is_online | Boolean | 是否在线 |
| last_seen | DateTime | 最后在线时间 |
| upload_speed | Float | 上传速度 |
| download_speed | Float | 下载速度 |

### network_latency - 网络延迟

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| timestamp | DateTime | 时间戳 |
| target | String(255) | 目标地址 |
| latency | Float | 延迟 (ms) |
| packet_loss | Float | 丢包率 (%) |

### router_status - 路由器状态

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| timestamp | DateTime | 时间戳 |
| cpu_usage | Float | CPU使用率 (%) |
| memory_usage | Float | 内存使用率 (%) |
| temperature | Float | 温度 (°C) |
| uptime | Integer | 运行时间 (秒) |
| wan_status | String(50) | WAN状态 |

### bandwidth_usage - 宽带使用

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| timestamp | DateTime | 时间戳 |
| device_mac | String(17) | 设备MAC |
| upload_bytes | Float | 上传字节数 |
| download_bytes | Float | 下载字节数 |

### connection_quality - 连接质量

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| timestamp | DateTime | 时间戳 |
| signal_strength | Float | 信号强度 (%) |
| stability | Float | 稳定性 (%) |
| error_rate | Float | 错误率 (%) |
| retransmit_rate | Float | 重传率 (%) |

---

## ⏰ 数据采集任务

| 任务 | 频率 | 说明 |
|------|------|------|
| 网络流量 | 5秒 | 采集上传/下载速度和总流量 |
| 在线设备 | 10秒 | 更新设备列表和状态 |
| 路由器状态 | 5秒 | 采集CPU、内存、温度等 |
| 网络延迟 | 10秒 | Ping多个目标测试延迟 |
| 连接质量 | 30秒 | 采集信号强度和稳定性 |
| 清理旧数据 | 1小时 | 删除7天前的数据 |

---

## 🔍 故障排查

### 查看日志

```bash
# Docker方式
docker-compose logs -f

# 手动运行方式
tail -f logs/jarvis.log
```

### 测试数据库连接

```bash
python3 -c "from models.database import engine; engine.connect(); print('数据库连接成功')"
```

### 测试路由器连接

```bash
curl http://192.168.100.1
```

### 检查端口占用

```bash
sudo lsof -i :3000
```

---

## 🛠️ 开发

### 添加新的API接口

编辑 `api/__init__.py`:

```python
@router.get("/your-endpoint")
async def your_function(db: Session = Depends(get_db)):
    # 你的逻辑
    return {"data": "result"}
```

### 添加新的数据采集任务

编辑 `services/data_collector.py`:

```python
async def collect_your_data(self):
    # 你的采集逻辑
    pass

# 在start()方法中添加定时任务
self.scheduler.add_job(
    self.collect_your_data,
    'interval',
    seconds=30,
    id='collect_your_data'
)
```

### 添加新的数据库表

编辑 `models/database.py`:

```python
class YourTable(Base):
    __tablename__ = "your_table"
    
    id = Column(Integer, primary_key=True, index=True)
    # 你的字段
```

---

## 📝 技术栈

- **FastAPI** - 现代Python Web框架
- **SQLAlchemy** - Python ORM
- **APScheduler** - 定时任务调度
- **Httpx** - 异步HTTP客户端
- **Uvicorn** - ASGI服务器
- **PyMySQL** - MySQL驱动

---

## 🔗 相关链接

- [FastAPI文档](https://fastapi.tiangolo.com/)
- [SQLAlchemy文档](https://docs.sqlalchemy.org/)
- [APScheduler文档](https://apscheduler.readthedocs.io/)

---

## 📄 许可证

MIT License

---

**Python后端完成！配合React前端，打造贾维斯风格的网络监控系统。** 🎉
