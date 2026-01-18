# 🚀 贾维斯智能监控系统 - NAS部署包

## 📦 部署包内容

```
python_backend/
├── main.py                    # FastAPI主应用
├── requirements.txt           # Python依赖
├── Dockerfile                 # Docker镜像配置
├── docker-compose.yml         # Docker编排
├── deploy_to_nas.sh          # 一键部署脚本 ⭐
├── .env.nas                  # 预配置环境变量
├── .env.template             # 环境变量模板
├── NAS_DEPLOYMENT_GUIDE.md   # 详细部署指南 ⭐
├── README.md                 # Python后端说明
├── models/                   # 数据库模型
├── api/                      # API路由
├── services/                 # 数据采集服务
└── utils/                    # 工具类
```

---

## ⚡ 快速部署（3步）

### 1️⃣ 上传到NAS

```bash
# 方法A：使用scp上传
scp jarvis-monitor-python-deploy.tar.gz zhanglushun@192.168.100.221:~/

# 方法B：使用FTP/SFTP工具上传到NAS的home目录
```

### 2️⃣ SSH连接并解压

```bash
# 连接到NAS
ssh zhanglushun@192.168.100.221

# 解压部署包
cd ~
tar -xzf jarvis-monitor-python-deploy.tar.gz
cd python_backend

# 配置环境变量（已预填路由器信息）
cp .env.nas .env
```

### 3️⃣ 一键部署

```bash
chmod +x deploy_to_nas.sh
bash deploy_to_nas.sh
```

---

## ✅ 验证部署

### 检查服务状态

```bash
docker-compose ps
```

应该看到：
```
NAME                    STATUS
jarvis-monitor-python   Up (healthy)
```

### 健康检查

```bash
curl http://localhost:3000/health
```

应该返回：
```json
{
  "status": "ok",
  "message": "贾维斯智能监控系统运行正常",
  "collector_running": true
}
```

### 查看日志

```bash
docker-compose logs -f
```

应该看到数据采集日志：
```
INFO - 网络流量数据已保存: 上传=123.45 KB/s, 下载=567.89 KB/s
INFO - 在线设备数据已更新: 5台设备
```

### 访问应用

在浏览器打开：
```
http://192.168.100.221:3000
```

---

## 📋 配置说明

### 环境变量（.env文件）

已预配置的值：
```env
DATABASE_URL=sqlite:///./data/network_monitor.db  # SQLite数据库
PORT=3000                                          # 服务端口
ROUTER_URL=http://192.168.100.1                   # 路由器地址
ROUTER_USERNAME=root                               # 路由器用户名
ROUTER_PASSWORD=password                           # 路由器密码 ⚠️
DATA_RETENTION_DAYS=7                              # 数据保留7天
```

⚠️ **重要**：如果路由器密码不是`password`，请编辑`.env`文件修改。

---

## 🔧 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose stop

# 启动服务
docker-compose start

# 删除服务（保留数据）
docker-compose down
```

---

## 🐛 故障排查

### 问题1：端口被占用

```bash
# 检查端口
sudo lsof -i :3000

# 修改端口（编辑.env）
PORT=3001

# 重新部署
docker-compose down && docker-compose up -d
```

### 问题2：无法连接路由器

```bash
# 测试连通性
ping 192.168.100.1

# 检查路由器密码
nano .env  # 修改ROUTER_PASSWORD

# 重启服务
docker-compose restart
```

### 问题3：数据不更新

```bash
# 查看详细日志
docker-compose logs -f | grep ERROR

# 检查数据库
ls -lh data/network_monitor.db

# 重启数据采集
docker-compose restart
```

---

## 📚 详细文档

- **NAS_DEPLOYMENT_GUIDE.md** - 完整部署指南
- **README.md** - Python后端说明
- **PYTHON_DEPLOYMENT.md** - 详细技术文档

---

## 🎯 部署后检查清单

- [ ] 容器状态为`Up (healthy)`
- [ ] 健康检查返回`"status": "ok"`
- [ ] 日志显示数据正在采集
- [ ] 可以访问 http://192.168.100.221:3000
- [ ] 界面显示贾维斯风格
- [ ] 数据实时更新

---

## 🆘 需要帮助？

1. 查看详细日志：`docker-compose logs -f`
2. 阅读部署指南：`cat NAS_DEPLOYMENT_GUIDE.md`
3. 检查配置文件：`cat .env`
4. 测试API接口：`curl http://localhost:3000/api/dashboard/overview`

---

**祝部署顺利！** 🎉
