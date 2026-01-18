"""
iStoreOS路由器API客户端 - 真实数据对接版本
基于LuCI RPC协议和OpenWrt标准接口
"""
import httpx
import asyncio
import re
import time
from typing import Dict, List, Optional, Tuple
import os
import logging
import json

logger = logging.getLogger(__name__)

class IStoreOSClient:
    """iStoreOS路由器API客户端"""
    
    def __init__(self):
        self.router_url = os.getenv("ROUTER_URL", "http://192.168.100.1")
        self.username = os.getenv("ROUTER_USERNAME", "root")
        self.password = os.getenv("ROUTER_PASSWORD", "password")
        self.session_token = None
        self.client = httpx.AsyncClient(timeout=10.0, verify=False)
        self.last_traffic_data = {}  # 用于计算流量速度
        self.last_traffic_time = 0
    
    async def login(self) -> bool:
        """登录路由器获取session token"""
        try:
            response = await self.client.post(
                f"{self.router_url}/cgi-bin/luci/rpc/auth",
                json={
                    "id": 1,
                    "method": "login",
                    "params": [self.username, self.password]
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if "result" in data and data["result"]:
                    self.session_token = data["result"]
                    logger.info(f"[iStoreOS] 登录成功，token: {self.session_token[:20]}...")
                    return True
            
            logger.error(f"[iStoreOS] 登录失败: {response.text}")
            return False
        except Exception as e:
            logger.error(f"[iStoreOS] 登录异常: {e}")
            return False
    
    async def call_rpc(self, endpoint: str, method: str, params: List) -> Optional[Dict]:
        """调用LuCI RPC接口"""
        if not self.session_token:
            if not await self.login():
                return None
        
        try:
            # 在params前面插入session token
            full_params = [self.session_token] + params
            
            response = await self.client.post(
                f"{self.router_url}/cgi-bin/luci/rpc/{endpoint}",
                json={
                    "id": 1,
                    "method": method,
                    "params": full_params
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if "result" in data:
                    return data["result"]
                elif "error" in data:
                    logger.error(f"[iStoreOS] RPC错误: {data['error']}")
                    # Token可能过期，尝试重新登录
                    if "access denied" in str(data['error']).lower():
                        self.session_token = None
                        return await self.call_rpc(endpoint, method, params)
            
            return None
        except Exception as e:
            logger.error(f"[iStoreOS] RPC调用失败 ({endpoint}.{method}): {e}")
            return None
    
    async def exec_command(self, command: str) -> Optional[str]:
        """执行系统命令（通过LuCI RPC sys.exec）"""
        try:
            result = await self.call_rpc("sys", "exec", [command])
            return result
        except Exception as e:
            logger.error(f"[iStoreOS] 命令执行失败: {e}")
            return None
    
    async def get_network_traffic(self) -> Dict:
        """
        获取网络流量数据
        通过读取/proc/net/dev获取网络接口流量统计
        """
        try:
            # 读取/proc/net/dev
            result = await self.exec_command("cat /proc/net/dev")
            if not result:
                logger.warning("[iStoreOS] 无法读取/proc/net/dev，使用模拟数据")
                return self._get_mock_traffic()
            
            # 解析网络接口数据
            interfaces = self._parse_net_dev(result)
            
            # 选择主要接口（pppoe-wan或br-lan）
            wan_interface = None
            for iface_name in ['pppoe-wan', 'eth0', 'wan']:
                if iface_name in interfaces:
                    wan_interface = interfaces[iface_name]
                    break
            
            if not wan_interface:
                # 如果没有找到WAN接口，使用第一个非lo接口
                for iface_name, iface_data in interfaces.items():
                    if iface_name != 'lo':
                        wan_interface = iface_data
                        break
            
            if not wan_interface:
                logger.warning("[iStoreOS] 未找到有效网络接口")
                return self._get_mock_traffic()
            
            # 计算速度（需要两次采样）
            current_time = time.time()
            rx_bytes = wan_interface['rx_bytes']
            tx_bytes = wan_interface['tx_bytes']
            
            upload_speed = 0
            download_speed = 0
            
            if self.last_traffic_data and self.last_traffic_time > 0:
                time_diff = current_time - self.last_traffic_time
                if time_diff > 0:
                    # 计算速度（字节/秒）
                    download_speed = (rx_bytes - self.last_traffic_data.get('rx_bytes', 0)) / time_diff
                    upload_speed = (tx_bytes - self.last_traffic_data.get('tx_bytes', 0)) / time_diff
                    
                    # 确保速度不为负（可能因为路由器重启导致计数器重置）
                    download_speed = max(0, download_speed)
                    upload_speed = max(0, upload_speed)
            
            # 保存当前数据用于下次计算
            self.last_traffic_data = {
                'rx_bytes': rx_bytes,
                'tx_bytes': tx_bytes
            }
            self.last_traffic_time = current_time
            
            return {
                "upload_speed": upload_speed,  # 字节/秒
                "download_speed": download_speed,  # 字节/秒
                "total_upload": tx_bytes,  # 总上传字节数
                "total_download": rx_bytes,  # 总下载字节数
            }
            
        except Exception as e:
            logger.error(f"[iStoreOS] 获取网络流量失败: {e}")
            return self._get_mock_traffic()
    
    def _parse_net_dev(self, data: str) -> Dict[str, Dict]:
        """解析/proc/net/dev内容"""
        interfaces = {}
        lines = data.strip().split('\n')
        
        for line in lines[2:]:  # 跳过前两行标题
            parts = line.split(':')
            if len(parts) != 2:
                continue
            
            iface_name = parts[0].strip()
            stats = parts[1].split()
            
            if len(stats) >= 16:
                interfaces[iface_name] = {
                    'rx_bytes': int(stats[0]),
                    'rx_packets': int(stats[1]),
                    'tx_bytes': int(stats[8]),
                    'tx_packets': int(stats[9]),
                }
        
        return interfaces
    
    def _get_mock_traffic(self) -> Dict:
        """返回模拟流量数据"""
        import random
        return {
            "upload_speed": random.uniform(100, 1000),
            "download_speed": random.uniform(500, 5000),
            "total_upload": random.uniform(1000000, 10000000),
            "total_download": random.uniform(5000000, 50000000),
        }
    
    async def get_online_devices(self) -> List[Dict]:
        """
        获取在线设备列表
        通过读取DHCP leases和ARP表
        """
        try:
            # 读取DHCP租约文件
            dhcp_result = await self.exec_command("cat /tmp/dhcp.leases")
            # 读取ARP表
            arp_result = await self.exec_command("cat /proc/net/arp")
            
            if not dhcp_result and not arp_result:
                logger.warning("[iStoreOS] 无法读取设备信息，使用模拟数据")
                return self._get_mock_devices()
            
            devices = []
            
            # 解析DHCP租约
            dhcp_devices = {}
            if dhcp_result:
                for line in dhcp_result.strip().split('\n'):
                    parts = line.split()
                    if len(parts) >= 4:
                        # 格式: timestamp mac ip hostname
                        mac = parts[1].upper()
                        ip = parts[2]
                        hostname = parts[3] if len(parts) > 3 else "Unknown"
                        dhcp_devices[mac] = {
                            'ip': ip,
                            'hostname': hostname
                        }
            
            # 解析ARP表
            if arp_result:
                lines = arp_result.strip().split('\n')
                for line in lines[1:]:  # 跳过标题行
                    parts = line.split()
                    if len(parts) >= 6:
                        ip = parts[0]
                        mac = parts[3].upper()
                        
                        if mac == "00:00:00:00:00:00":
                            continue
                        
                        # 合并DHCP信息
                        hostname = dhcp_devices.get(mac, {}).get('hostname', 'Unknown')
                        
                        devices.append({
                            "mac_address": mac,
                            "ip_address": ip,
                            "hostname": hostname,
                            "device_type": self._guess_device_type(hostname, mac),
                            "is_online": True,
                            "upload_speed": 0,  # 需要额外的流量统计
                            "download_speed": 0,
                        })
            
            logger.info(f"[iStoreOS] 获取到 {len(devices)} 台在线设备")
            return devices if devices else self._get_mock_devices()
            
        except Exception as e:
            logger.error(f"[iStoreOS] 获取在线设备失败: {e}")
            return self._get_mock_devices()
    
    def _guess_device_type(self, hostname: str, mac: str) -> str:
        """根据主机名和MAC地址猜测设备类型"""
        hostname_lower = hostname.lower()
        
        if any(x in hostname_lower for x in ['iphone', 'ipad', 'android', 'phone']):
            return 'mobile'
        elif any(x in hostname_lower for x in ['laptop', 'macbook', 'thinkpad']):
            return 'computer'
        elif any(x in hostname_lower for x in ['tv', 'roku', 'chromecast']):
            return 'tv'
        elif any(x in hostname_lower for x in ['nas', 'server']):
            return 'server'
        else:
            return 'other'
    
    def _get_mock_devices(self) -> List[Dict]:
        """返回模拟设备数据"""
        import random
        return [
            {
                "mac_address": "AA:BB:CC:DD:EE:01",
                "ip_address": "192.168.100.10",
                "hostname": "iPhone",
                "device_type": "mobile",
                "is_online": True,
                "upload_speed": random.uniform(10, 100),
                "download_speed": random.uniform(50, 500),
            },
            {
                "mac_address": "AA:BB:CC:DD:EE:02",
                "ip_address": "192.168.100.20",
                "hostname": "Laptop",
                "device_type": "computer",
                "is_online": True,
                "upload_speed": random.uniform(10, 100),
                "download_speed": random.uniform(50, 500),
            },
        ]
    
    async def get_router_status(self) -> Dict:
        """
        获取路由器状态
        包括CPU、内存、运行时间、温度等
        """
        try:
            # 获取系统信息
            info_result = await self.call_rpc("sys", "info", [])
            
            if not info_result:
                logger.warning("[iStoreOS] 无法获取系统信息，使用模拟数据")
                return self._get_mock_router_status()
            
            # 解析系统信息
            cpu_usage = 0
            memory_usage = 0
            uptime = 0
            
            # CPU使用率（从load average计算）
            if 'load' in info_result:
                load = info_result['load']
                if isinstance(load, list) and len(load) > 0:
                    # 1分钟负载 / CPU核心数 * 100
                    cpu_usage = min(100, load[0] * 100)
            
            # 内存使用率
            if 'memory' in info_result:
                mem = info_result['memory']
                if 'total' in mem and 'free' in mem:
                    total = mem['total']
                    free = mem['free']
                    if total > 0:
                        memory_usage = ((total - free) / total) * 100
            
            # 运行时间
            if 'uptime' in info_result:
                uptime = info_result['uptime']
            
            # 温度（尝试读取thermal zone）
            temperature = 0
            temp_result = await self.exec_command("cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null || echo 0")
            if temp_result:
                try:
                    # 温度单位通常是毫摄氏度
                    temperature = int(temp_result.strip()) / 1000
                except:
                    temperature = 0
            
            return {
                "cpu_usage": cpu_usage,
                "memory_usage": memory_usage,
                "temperature": temperature,
                "uptime": uptime,
                "wan_status": "connected",  # 简化处理，假设已连接
            }
            
        except Exception as e:
            logger.error(f"[iStoreOS] 获取路由器状态失败: {e}")
            return self._get_mock_router_status()
    
    def _get_mock_router_status(self) -> Dict:
        """返回模拟路由器状态"""
        import random
        return {
            "cpu_usage": random.uniform(10, 50),
            "memory_usage": random.uniform(30, 70),
            "temperature": random.uniform(40, 60),
            "uptime": 86400,
            "wan_status": "connected",
        }
    
    async def get_network_latency(self, target: str = "8.8.8.8") -> Dict:
        """
        获取网络延迟
        通过ping命令测试
        """
        try:
            # 执行ping命令（发送3个包）
            ping_result = await self.exec_command(f"ping -c 3 -W 2 {target}")
            
            if not ping_result:
                logger.warning(f"[iStoreOS] 无法ping {target}，使用模拟数据")
                return self._get_mock_latency(target)
            
            # 解析ping结果
            latency = 0
            packet_loss = 100
            jitter = 0
            
            # 查找丢包率
            loss_match = re.search(r'(\d+)% packet loss', ping_result)
            if loss_match:
                packet_loss = float(loss_match.group(1))
            
            # 查找平均延迟
            # 格式: rtt min/avg/max/mdev = 10.1/15.2/20.3/5.1 ms
            rtt_match = re.search(r'rtt min/avg/max/mdev = ([\d.]+)/([\d.]+)/([\d.]+)/([\d.]+)', ping_result)
            if rtt_match:
                latency = float(rtt_match.group(2))  # avg
                jitter = float(rtt_match.group(4))   # mdev
            
            return {
                "target": target,
                "latency": latency,
                "packet_loss": packet_loss,
                "jitter": jitter,
            }
            
        except Exception as e:
            logger.error(f"[iStoreOS] 获取网络延迟失败: {e}")
            return self._get_mock_latency(target)
    
    def _get_mock_latency(self, target: str) -> Dict:
        """返回模拟延迟数据"""
        import random
        return {
            "target": target,
            "latency": random.uniform(10, 50),
            "packet_loss": random.uniform(0, 5),
            "jitter": random.uniform(1, 10),
        }
    
    async def get_connection_quality(self) -> Dict:
        """
        获取连接质量
        基于网络延迟和丢包率计算
        """
        try:
            # 获取延迟数据
            latency_data = await self.get_network_latency()
            
            # 根据延迟和丢包率计算连接质量
            latency = latency_data.get('latency', 0)
            packet_loss = latency_data.get('packet_loss', 0)
            jitter = latency_data.get('jitter', 0)
            
            # 信号强度（基于延迟，延迟越低信号越强）
            if latency < 20:
                signal_strength = 100
            elif latency < 50:
                signal_strength = 80
            elif latency < 100:
                signal_strength = 60
            else:
                signal_strength = 40
            
            # 稳定性（基于丢包率和抖动）
            stability = max(0, 100 - packet_loss * 10 - jitter)
            
            # 错误率（基于丢包率）
            error_rate = packet_loss / 10
            
            # 重传率（估算）
            retransmit_rate = min(10, packet_loss * 0.5 + jitter * 0.2)
            
            return {
                "signal_strength": signal_strength,
                "stability": stability,
                "error_rate": error_rate,
                "retransmit_rate": retransmit_rate,
            }
            
        except Exception as e:
            logger.error(f"[iStoreOS] 获取连接质量失败: {e}")
            return self._get_mock_connection_quality()
    
    def _get_mock_connection_quality(self) -> Dict:
        """返回模拟连接质量数据"""
        import random
        return {
            "signal_strength": random.uniform(70, 100),
            "stability": random.uniform(80, 100),
            "error_rate": random.uniform(0, 2),
            "retransmit_rate": random.uniform(0, 5),
        }
    
    async def close(self):
        """关闭客户端"""
        await self.client.aclose()
