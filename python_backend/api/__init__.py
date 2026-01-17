"""
API路由模块
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta
from typing import List, Optional
from models.database import (
    get_db, NetworkTraffic, OnlineDevice, NetworkLatency,
    RouterStatus, BandwidthUsage, ConnectionQuality
)

router = APIRouter()

@router.get("/dashboard/overview")
async def get_dashboard_overview(db: Session = Depends(get_db)):
    """获取仪表板概览数据"""
    
    # 最新网络流量
    latest_traffic = db.query(NetworkTraffic).order_by(desc(NetworkTraffic.timestamp)).first()
    
    # 在线设备列表
    online_devices = db.query(OnlineDevice).filter(OnlineDevice.is_online == True).all()
    
    # 最近的延迟数据
    recent_latency = db.query(NetworkLatency).order_by(desc(NetworkLatency.timestamp)).limit(10).all()
    
    # 最新路由器状态
    latest_router_status = db.query(RouterStatus).order_by(desc(RouterStatus.timestamp)).first()
    
    # 最新连接质量
    latest_connection_quality = db.query(ConnectionQuality).order_by(desc(ConnectionQuality.timestamp)).first()
    
    return {
        "networkTraffic": {
            "id": latest_traffic.id if latest_traffic else None,
            "timestamp": latest_traffic.timestamp.isoformat() if latest_traffic else None,
            "uploadSpeed": latest_traffic.upload_speed if latest_traffic else 0,
            "downloadSpeed": latest_traffic.download_speed if latest_traffic else 0,
            "totalUpload": latest_traffic.total_upload if latest_traffic else 0,
            "totalDownload": latest_traffic.total_download if latest_traffic else 0,
        } if latest_traffic else None,
        "onlineDevices": [
            {
                "id": device.id,
                "macAddress": device.mac_address,
                "ipAddress": device.ip_address,
                "hostname": device.hostname,
                "deviceType": device.device_type,
                "isOnline": device.is_online,
                "lastSeen": device.last_seen.isoformat(),
                "uploadSpeed": device.upload_speed,
                "downloadSpeed": device.download_speed,
            }
            for device in online_devices
        ],
        "latency": [
            {
                "id": lat.id,
                "timestamp": lat.timestamp.isoformat(),
                "target": lat.target,
                "latency": lat.latency,
                "packetLoss": lat.packet_loss,
            }
            for lat in recent_latency
        ],
        "routerStatus": {
            "id": latest_router_status.id if latest_router_status else None,
            "timestamp": latest_router_status.timestamp.isoformat() if latest_router_status else None,
            "cpuUsage": latest_router_status.cpu_usage if latest_router_status else 0,
            "memoryUsage": latest_router_status.memory_usage if latest_router_status else 0,
            "temperature": latest_router_status.temperature if latest_router_status else 0,
            "uptime": latest_router_status.uptime if latest_router_status else 0,
            "wanStatus": latest_router_status.wan_status if latest_router_status else "unknown",
        } if latest_router_status else None,
        "connectionQuality": {
            "id": latest_connection_quality.id if latest_connection_quality else None,
            "timestamp": latest_connection_quality.timestamp.isoformat() if latest_connection_quality else None,
            "signalStrength": latest_connection_quality.signal_strength if latest_connection_quality else 0,
            "stability": latest_connection_quality.stability if latest_connection_quality else 0,
            "errorRate": latest_connection_quality.error_rate if latest_connection_quality else 0,
            "retransmitRate": latest_connection_quality.retransmit_rate if latest_connection_quality else 0,
        } if latest_connection_quality else None,
    }

@router.get("/dashboard/historical")
async def get_historical_data(hours: int = 24, db: Session = Depends(get_db)):
    """获取历史数据"""
    
    time_threshold = datetime.utcnow() - timedelta(hours=hours)
    
    # 网络流量历史
    traffic_history = db.query(NetworkTraffic).filter(
        NetworkTraffic.timestamp >= time_threshold
    ).order_by(NetworkTraffic.timestamp).limit(288).all()
    
    # 路由器状态历史
    router_history = db.query(RouterStatus).filter(
        RouterStatus.timestamp >= time_threshold
    ).order_by(RouterStatus.timestamp).limit(288).all()
    
    return {
        "networkTraffic": [
            {
                "timestamp": t.timestamp.isoformat(),
                "uploadSpeed": t.upload_speed,
                "downloadSpeed": t.download_speed,
                "totalUpload": t.total_upload,
                "totalDownload": t.total_download,
            }
            for t in traffic_history
        ],
        "routerStatus": [
            {
                "timestamp": r.timestamp.isoformat(),
                "cpuUsage": r.cpu_usage,
                "memoryUsage": r.memory_usage,
                "temperature": r.temperature,
            }
            for r in router_history
        ],
    }

@router.get("/devices")
async def get_devices(db: Session = Depends(get_db)):
    """获取所有设备"""
    devices = db.query(OnlineDevice).all()
    return [
        {
            "id": device.id,
            "macAddress": device.mac_address,
            "ipAddress": device.ip_address,
            "hostname": device.hostname,
            "deviceType": device.device_type,
            "isOnline": device.is_online,
            "lastSeen": device.last_seen.isoformat(),
            "uploadSpeed": device.upload_speed,
            "downloadSpeed": device.download_speed,
        }
        for device in devices
    ]
