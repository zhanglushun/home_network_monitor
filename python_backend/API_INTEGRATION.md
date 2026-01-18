# iStoreOS路由器API对接说明

## 概述

本文档说明Python后端如何对接iStoreOS路由器的真实数据。系统使用LuCI RPC协议和OpenWrt标准接口获取路由器的各项数据。

## 技术架构

### 核心组件
- **istoreos_client.py**: 路由器API客户端，封装所有数据获取逻辑
- **data_collector.py**: 数据采集服务，定时调用客户端获取数据并存储到数据库
- **LuCI RPC**: OpenWrt标准的JSON-RPC接口

### 认证流程
1. 使用用户名和密码调用 `/cgi-bin/luci/rpc/auth` 接口
2. 获取session token
3. 后续所有API调用都携带此token

## 数据采集方法

### 1. 网络流量数据
**方法**: `get_network_traffic()`

**数据来源**: `/proc/net/dev`

**实现原理**:
- 读取Linux内核网络接口统计文件
- 解析每个网络接口的接收/发送字节数
- 通过两次采样计算速度（字节/秒）
- 自动选择主要WAN接口（pppoe-wan、eth0等）

**返回数据**:
```python
{
    "upload_speed": float,      # 上传速度（字节/秒）
    "download_speed": float,    # 下载速度（字节/秒）
    "total_upload": int,        # 总上传字节数
    "total_download": int,      # 总下载字节数
}
```

**注意事项**:
- 首次调用速度为0（需要两次采样）
- 路由器重启会导致计数器重置
- 已添加负值保护

### 2. 在线设备列表
**方法**: `get_online_devices()`

**数据来源**: 
- `/tmp/dhcp.leases` (DHCP租约文件)
- `/proc/net/arp` (ARP表)

**实现原理**:
- 读取DHCP租约获取IP、MAC、主机名映射
- 读取ARP表获取当前在线设备
- 合并两个数据源，补全设备信息
- 根据主机名和MAC地址猜测设备类型

**返回数据**:
```python
[
    {
        "mac_address": str,      # MAC地址
        "ip_address": str,       # IP地址
        "hostname": str,         # 主机名
        "device_type": str,      # 设备类型（mobile/computer/tv/server/other）
        "is_online": bool,       # 是否在线
        "upload_speed": float,   # 上传速度（需要额外统计）
        "download_speed": float, # 下载速度（需要额外统计）
    }
]
```

**设备类型识别**:
- mobile: iPhone, iPad, Android, Phone
- computer: Laptop, MacBook, ThinkPad
- tv: TV, Roku, Chromecast
- server: NAS, Server
- other: 其他设备

### 3. 路由器状态
**方法**: `get_router_status()`

**数据来源**:
- LuCI RPC `sys.info` 接口
- `/sys/class/thermal/thermal_zone0/temp` (温度)

**实现原理**:
- 调用sys.info获取系统负载、内存、运行时间
- 从load average计算CPU使用率
- 从memory统计计算内存使用率
- 读取thermal zone获取温度（毫摄氏度转摄氏度）

**返回数据**:
```python
{
    "cpu_usage": float,       # CPU使用率（%）
    "memory_usage": float,    # 内存使用率（%）
    "temperature": float,     # 温度（℃）
    "uptime": int,            # 运行时间（秒）
    "wan_status": str,        # WAN状态（connected/disconnected）
}
```

**CPU计算公式**:
```
CPU使用率 = min(100, 1分钟负载 * 100)
```

**内存计算公式**:
```
内存使用率 = (总内存 - 空闲内存) / 总内存 * 100
```

### 4. 网络延迟
**方法**: `get_network_latency(target="8.8.8.8")`

**数据来源**: `ping` 命令

**实现原理**:
- 执行 `ping -c 3 -W 2 <target>` 命令
- 解析ping输出，提取延迟和丢包率
- 使用正则表达式匹配统计信息

**返回数据**:
```python
{
    "target": str,           # 目标地址
    "latency": float,        # 平均延迟（毫秒）
    "packet_loss": float,    # 丢包率（%）
    "jitter": float,         # 抖动（毫秒）
}
```

**解析示例**:
```
3 packets transmitted, 3 received, 0% packet loss
rtt min/avg/max/mdev = 10.1/15.2/20.3/5.1 ms
```

### 5. 连接质量
**方法**: `get_connection_quality()`

**数据来源**: 基于网络延迟数据计算

**实现原理**:
- 调用get_network_latency获取延迟、丢包率、抖动
- 根据延迟计算信号强度
- 根据丢包率和抖动计算稳定性
- 估算错误率和重传率

**返回数据**:
```python
{
    "signal_strength": float,   # 信号强度（0-100）
    "stability": float,         # 稳定性（0-100）
    "error_rate": float,        # 错误率（%）
    "retransmit_rate": float,   # 重传率（%）
}
```

**计算规则**:
- 信号强度: 延迟<20ms=100, <50ms=80, <100ms=60, 其他=40
- 稳定性: 100 - 丢包率*10 - 抖动
- 错误率: 丢包率 / 10
- 重传率: 丢包率*0.5 + 抖动*0.2

## 容错机制

### 1. 自动降级
当无法获取真实数据时，自动切换到模拟数据，确保系统持续运行。

### 2. Token自动刷新
检测到"access denied"错误时，自动重新登录获取新token。

### 3. 超时保护
所有HTTP请求设置10秒超时，避免长时间阻塞。

### 4. 异常日志
所有异常都会记录到日志，便于排查问题。

## 部署要求

### 环境变量
```bash
ROUTER_URL=http://192.168.100.1
ROUTER_USERNAME=root
ROUTER_PASSWORD=password
```

### 网络要求
- Python后端必须与路由器在同一局域网内
- 能够访问路由器的80端口（HTTP）
- 建议部署在飞牛OS NAS (192.168.100.221)

### 路由器要求
- iStoreOS或OpenWrt系统
- 已安装 `luci-mod-rpc` 包（通常默认安装）
- 开启LuCI Web界面

## 测试方法

### 1. 测试登录
```python
import asyncio
from utils.istoreos_client import IStoreOSClient

async def test_login():
    client = IStoreOSClient()
    result = await client.login()
    print(f"登录结果: {result}")
    await client.close()

asyncio.run(test_login())
```

### 2. 测试数据获取
```python
async def test_data():
    client = IStoreOSClient()
    await client.login()
    
    # 测试网络流量
    traffic = await client.get_network_traffic()
    print(f"网络流量: {traffic}")
    
    # 测试设备列表
    devices = await client.get_online_devices()
    print(f"在线设备数: {len(devices)}")
    
    # 测试路由器状态
    status = await client.get_router_status()
    print(f"路由器状态: {status}")
    
    await client.close()

asyncio.run(test_data())
```

## 性能优化

### 1. 连接复用
使用httpx.AsyncClient复用HTTP连接，减少握手开销。

### 2. 批量采集
data_collector按不同频率采集数据：
- 网络流量: 5秒
- 路由器状态: 5秒
- 在线设备: 10秒
- 网络延迟: 10秒
- 连接质量: 30秒

### 3. 异步执行
所有API调用都是异步的，不会阻塞主线程。

## 已知限制

1. **设备流量统计**: 当前版本无法获取单个设备的实时流量，需要额外的nftables或iptables规则
2. **温度传感器**: 部分路由器可能没有温度传感器，返回0
3. **WAN状态**: 简化处理，假设已连接（需要进一步实现接口状态检测）
4. **首次流量**: 首次调用get_network_traffic()速度为0（需要两次采样）

## 未来改进

1. 实现单设备流量统计（通过nftables/iptables）
2. 添加更多网络接口支持（多WAN、IPv6）
3. 实现WAN接口状态检测
4. 添加设备分组和标签功能
5. 支持更多路由器系统（Padavan、梅林等）

## 参考资料

- [OpenWrt LuCI RPC文档](https://github.com/openwrt/luci/blob/master/docs/JsonRpcHowTo.md)
- [openwrt-luci-rpc Python库](https://github.com/fbradyirl/openwrt-luci-rpc)
- [Linux /proc/net/dev格式](https://www.kernel.org/doc/Documentation/filesystems/proc.txt)
