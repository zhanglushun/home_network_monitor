# 快速部署指南 - 飞牛OS NAS

## 前提条件

- 飞牛OS NAS IP: 192.168.100.221
- iStoreOS路由器 IP: 192.168.100.1
- 路由器用户名: root
- 路由器密码: password
- 已安装Docker和Docker Compose

## 方式一：自动部署（推荐）

### 1. SSH连接到NAS
```bash
ssh root@192.168.100.221
```

### 2. 克隆或更新代码
```bash
# 如果是首次部署
cd /root
git clone https://github.com/YOUR_USERNAME/home_network_monitor.git
cd home_network_monitor/python_backend

# 如果已经部署过，只需更新
cd /root/home_network_monitor
git pull origin main
cd python_backend
```

### 3. 配置环境变量
```bash
# 创建.env文件
cat > .env << EOF
ROUTER_URL=http://192.168.100.1
ROUTER_USERNAME=root
ROUTER_PASSWORD=password
DATABASE_URL=sqlite:///./data/network_monitor.db
EOF
```

### 4. 运行部署脚本
```bash
chmod +x deploy.sh
bash deploy.sh
```

脚本会自动完成：
- ✅ 检查环境配置
- ✅ 测试路由器连接
- ✅ 停止旧容器
- ✅ 构建新镜像
- ✅ 启动服务
- ✅ 验证部署状态

### 5. 访问系统
在浏览器中打开：
```
http://192.168.100.221:3001
```

---

## 方式二：手动部署

### 1. SSH连接并进入目录
```bash
ssh root@192.168.100.221
cd /root/home_network_monitor/python_backend
```

### 2. 配置环境变量
```bash
nano .env
```
填入：
```
ROUTER_URL=http://192.168.100.1
ROUTER_USERNAME=root
ROUTER_PASSWORD=password
DATABASE_URL=sqlite:///./data/network_monitor.db
```

### 3. 停止旧容器
```bash
docker-compose down
```

### 4. 构建镜像
```bash
docker-compose build --no-cache
```

### 5. 启动服务
```bash
docker-compose up -d
```

### 6. 查看日志
```bash
docker-compose logs -f
```

---

## 验证部署

### 1. 检查容器状态
```bash
docker-compose ps
```
应该看到容器状态为 `Up`

### 2. 查看日志
```bash
docker-compose logs --tail=50
```

**成功的标志：**
```
[iStoreOS] 登录成功，token: xxxxx...
[iStoreOS] 获取到 20 台在线设备
[INFO] 网络流量数据已保存
```

**失败的标志：**
```
[iStoreOS] 登录异常: timeout
[iStoreOS] 使用模拟数据
```

### 3. 测试网络连接
```bash
# 在NAS上测试能否连接路由器
ping -c 3 192.168.100.1

# 测试路由器Web界面
curl -I http://192.168.100.1
```

### 4. 访问前端界面
浏览器打开：`http://192.168.100.221:3001`

应该能看到：
- ✅ 真实的在线设备数量
- ✅ 真实的网络流量数据
- ✅ 真实的路由器CPU、内存使用率
- ✅ 国际和国内网络延迟

---

## 常见问题

### 问题1: 无法连接路由器
**症状**: 日志显示 "timeout" 或 "使用模拟数据"

**解决方法**:
```bash
# 1. 检查NAS能否ping通路由器
ping 192.168.100.1

# 2. 检查Docker网络模式
# 确保docker-compose.yml中使用 network_mode: "host"

# 3. 检查路由器凭据
nano .env  # 确认用户名密码正确

# 4. 重启容器
docker-compose restart
```

### 问题2: 端口被占用
**症状**: "port is already allocated"

**解决方法**:
```bash
# 查看占用端口的进程
netstat -tlnp | grep 3001

# 停止占用端口的进程
kill -9 <PID>

# 或修改端口
nano docker-compose.yml
# 将 "3001:3001" 改为 "3002:3001"
```

### 问题3: 数据仍然是模拟的
**症状**: 设备数量固定为2台，流量随机变化

**解决方法**:
```bash
# 1. 确认路由器已安装luci-mod-rpc
ssh root@192.168.100.1
opkg list-installed | grep luci-mod-rpc

# 如果没有安装
opkg update
opkg install luci-mod-rpc

# 2. 重启Python后端
docker-compose restart
```

### 问题4: 容器启动失败
**症状**: `docker-compose ps` 显示 Exit

**解决方法**:
```bash
# 查看详细错误
docker-compose logs

# 常见原因：
# - 权限问题：chmod 755 data/
# - 依赖缺失：docker-compose build --no-cache
# - 配置错误：检查.env文件
```

---

## 日常维护

### 查看实时日志
```bash
docker-compose logs -f
```

### 重启服务
```bash
docker-compose restart
```

### 停止服务
```bash
docker-compose down
```

### 更新代码
```bash
cd /root/home_network_monitor
git pull origin main
cd python_backend
bash deploy.sh
```

### 备份数据库
```bash
cp data/network_monitor.db data/network_monitor_backup_$(date +%Y%m%d).db
```

### 清理旧日志
```bash
docker-compose logs --tail=0 > /dev/null
```

---

## 性能优化

### 调整数据采集频率
编辑 `services/data_collector.py`:
```python
# 网络流量（默认5秒）
@self.scheduler.scheduled_job('interval', seconds=10)  # 改为10秒

# 延迟测试（默认10秒）
@self.scheduler.scheduled_job('interval', seconds=30)  # 改为30秒
```

### 调整数据保留时间
编辑 `services/data_collector.py`:
```python
# 默认保留7天
cutoff_time = datetime.now() - timedelta(days=3)  # 改为3天
```

---

## 技术支持

如果遇到问题：
1. 查看日志: `docker-compose logs -f`
2. 检查API文档: `cat API_INTEGRATION.md`
3. 查看详细部署文档: `cat DEPLOY_TO_NAS.md`

---

## 下一步

部署成功后，建议：
1. ✅ 设置开机自启动
2. ✅ 配置定时备份
3. ✅ 调整采集频率
4. ✅ 添加告警功能
