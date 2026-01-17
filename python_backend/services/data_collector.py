"""
数据收集服务
"""
import asyncio
import logging
from datetime import datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session
from models.database import (
    SessionLocal, NetworkTraffic, OnlineDevice, NetworkLatency,
    RouterStatus, BandwidthUsage, ConnectionQuality
)
from utils.istoreos_client import IStoreOSClient

logger = logging.getLogger(__name__)

class DataCollector:
    """数据收集服务"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.istoreos_client = IStoreOSClient()
        self.is_running = False
    
    async def start(self):
        """启动数据收集服务"""
        if self.is_running:
            logger.warning("数据收集服务已在运行")
            return
        
        logger.info("启动数据收集服务...")
        
        # 登录路由器
        await self.istoreos_client.login()
        
        # 添加定时任务
        self.scheduler.add_job(
            self.collect_network_traffic,
            'interval',
            seconds=5,
            id='collect_network_traffic'
        )
        
        self.scheduler.add_job(
            self.collect_online_devices,
            'interval',
            seconds=10,
            id='collect_online_devices'
        )
        
        self.scheduler.add_job(
            self.collect_router_status,
            'interval',
            seconds=5,
            id='collect_router_status'
        )
        
        self.scheduler.add_job(
            self.collect_network_latency,
            'interval',
            seconds=10,
            id='collect_network_latency'
        )
        
        self.scheduler.add_job(
            self.collect_connection_quality,
            'interval',
            seconds=30,
            id='collect_connection_quality'
        )
        
        self.scheduler.add_job(
            self.cleanup_old_data,
            'interval',
            hours=1,
            id='cleanup_old_data'
        )
        
        self.scheduler.start()
        self.is_running = True
        logger.info("数据收集服务已启动")
    
    async def stop(self):
        """停止数据收集服务"""
        if not self.is_running:
            return
        
        logger.info("停止数据收集服务...")
        self.scheduler.shutdown()
        await self.istoreos_client.close()
        self.is_running = False
        logger.info("数据收集服务已停止")
    
    async def collect_network_traffic(self):
        """收集网络流量数据"""
        try:
            data = await self.istoreos_client.get_network_traffic()
            
            db = SessionLocal()
            try:
                traffic = NetworkTraffic(
                    timestamp=datetime.utcnow(),
                    upload_speed=data["upload_speed"],
                    download_speed=data["download_speed"],
                    total_upload=data["total_upload"],
                    total_download=data["total_download"]
                )
                db.add(traffic)
                db.commit()
                logger.debug(f"网络流量数据已保存: 上传={data['upload_speed']:.2f} KB/s, 下载={data['download_speed']:.2f} KB/s")
            finally:
                db.close()
        except Exception as e:
            logger.error(f"收集网络流量数据失败: {e}")
    
    async def collect_online_devices(self):
        """收集在线设备数据"""
        try:
            devices = await self.istoreos_client.get_online_devices()
            
            db = SessionLocal()
            try:
                for device_data in devices:
                    # 查找或创建设备
                    device = db.query(OnlineDevice).filter(
                        OnlineDevice.mac_address == device_data["mac_address"]
                    ).first()
                    
                    if device:
                        # 更新现有设备
                        device.ip_address = device_data["ip_address"]
                        device.hostname = device_data["hostname"]
                        device.device_type = device_data["device_type"]
                        device.is_online = device_data["is_online"]
                        device.last_seen = datetime.utcnow()
                        device.upload_speed = device_data["upload_speed"]
                        device.download_speed = device_data["download_speed"]
                        device.updated_at = datetime.utcnow()
                    else:
                        # 创建新设备
                        device = OnlineDevice(
                            mac_address=device_data["mac_address"],
                            ip_address=device_data["ip_address"],
                            hostname=device_data["hostname"],
                            device_type=device_data["device_type"],
                            is_online=device_data["is_online"],
                            last_seen=datetime.utcnow(),
                            upload_speed=device_data["upload_speed"],
                            download_speed=device_data["download_speed"]
                        )
                        db.add(device)
                
                db.commit()
                logger.debug(f"在线设备数据已更新: {len(devices)}台设备")
            finally:
                db.close()
        except Exception as e:
            logger.error(f"收集在线设备数据失败: {e}")
    
    async def collect_router_status(self):
        """收集路由器状态数据"""
        try:
            data = await self.istoreos_client.get_router_status()
            
            db = SessionLocal()
            try:
                status = RouterStatus(
                    timestamp=datetime.utcnow(),
                    cpu_usage=data["cpu_usage"],
                    memory_usage=data["memory_usage"],
                    temperature=data["temperature"],
                    uptime=data["uptime"],
                    wan_status=data["wan_status"]
                )
                db.add(status)
                db.commit()
                logger.debug(f"路由器状态已保存: CPU={data['cpu_usage']:.1f}%, 内存={data['memory_usage']:.1f}%")
            finally:
                db.close()
        except Exception as e:
            logger.error(f"收集路由器状态数据失败: {e}")
    
    async def collect_network_latency(self):
        """收集网络延迟数据"""
        try:
            targets = ["8.8.8.8", "114.114.114.114", "1.1.1.1"]
            
            db = SessionLocal()
            try:
                for target in targets:
                    data = await self.istoreos_client.get_network_latency(target)
                    
                    latency = NetworkLatency(
                        timestamp=datetime.utcnow(),
                        target=data["target"],
                        latency=data["latency"],
                        packet_loss=data["packet_loss"]
                    )
                    db.add(latency)
                
                db.commit()
                logger.debug(f"网络延迟数据已保存: {len(targets)}个目标")
            finally:
                db.close()
        except Exception as e:
            logger.error(f"收集网络延迟数据失败: {e}")
    
    async def collect_connection_quality(self):
        """收集连接质量数据"""
        try:
            data = await self.istoreos_client.get_connection_quality()
            
            db = SessionLocal()
            try:
                quality = ConnectionQuality(
                    timestamp=datetime.utcnow(),
                    signal_strength=data["signal_strength"],
                    stability=data["stability"],
                    error_rate=data["error_rate"],
                    retransmit_rate=data["retransmit_rate"]
                )
                db.add(quality)
                db.commit()
                logger.debug(f"连接质量数据已保存: 信号强度={data['signal_strength']:.1f}%")
            finally:
                db.close()
        except Exception as e:
            logger.error(f"收集连接质量数据失败: {e}")
    
    async def cleanup_old_data(self):
        """清理7天前的旧数据"""
        try:
            threshold = datetime.utcnow() - timedelta(days=7)
            
            db = SessionLocal()
            try:
                # 删除旧的网络流量数据
                deleted_traffic = db.query(NetworkTraffic).filter(
                    NetworkTraffic.timestamp < threshold
                ).delete()
                
                # 删除旧的网络延迟数据
                deleted_latency = db.query(NetworkLatency).filter(
                    NetworkLatency.timestamp < threshold
                ).delete()
                
                # 删除旧的路由器状态数据
                deleted_router = db.query(RouterStatus).filter(
                    RouterStatus.timestamp < threshold
                ).delete()
                
                # 删除旧的连接质量数据
                deleted_quality = db.query(ConnectionQuality).filter(
                    ConnectionQuality.timestamp < threshold
                ).delete()
                
                db.commit()
                logger.info(f"已清理旧数据: 流量={deleted_traffic}, 延迟={deleted_latency}, 路由器={deleted_router}, 质量={deleted_quality}")
            finally:
                db.close()
        except Exception as e:
            logger.error(f"清理旧数据失败: {e}")

# 全局数据收集器实例
data_collector = DataCollector()
