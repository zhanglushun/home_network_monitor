# 贾维斯智能监控系统 - FN OS NAS 配置文件

# 数据库配置（使用SQLite）
DATABASE_URL=sqlite:///./data/network_monitor.db

# 服务端口
PORT=3000

# 运行环境
NODE_ENV=production

# iStoreOS路由器配置
ROUTER_URL=http://192.168.100.1
ROUTER_USERNAME=root
ROUTER_PASSWORD=password

# 数据保留天数
DATA_RETENTION_DAYS=7
