"""
数据库模型定义
"""
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# 数据库连接
# 默认使用SQLite进行测试，生产环境可配置为MySQL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/network_monitor.db")

engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=3600)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 数据库依赖
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 模型定义
class NetworkTraffic(Base):
    __tablename__ = "network_traffic"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    upload_speed = Column(Float)
    download_speed = Column(Float)
    total_upload = Column(Float)
    total_download = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

class OnlineDevice(Base):
    __tablename__ = "online_devices"
    
    id = Column(Integer, primary_key=True, index=True)
    mac_address = Column(String(17), unique=True, index=True)
    ip_address = Column(String(15))
    hostname = Column(String(255))
    device_type = Column(String(50))
    is_online = Column(Boolean, default=True)
    last_seen = Column(DateTime, default=datetime.utcnow)
    upload_speed = Column(Float, default=0)
    download_speed = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class NetworkLatency(Base):
    __tablename__ = "network_latency"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    target = Column(String(255))
    latency = Column(Float)
    packet_loss = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class RouterStatus(Base):
    __tablename__ = "router_status"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    cpu_usage = Column(Float)
    memory_usage = Column(Float)
    temperature = Column(Float)
    uptime = Column(Integer)
    wan_status = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

class BandwidthUsage(Base):
    __tablename__ = "bandwidth_usage"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    device_mac = Column(String(17))
    upload_bytes = Column(Float)
    download_bytes = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

class ConnectionQuality(Base):
    __tablename__ = "connection_quality"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    signal_strength = Column(Float)
    stability = Column(Float)
    error_rate = Column(Float)
    retransmit_rate = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

# 创建所有表
def init_db():
    Base.metadata.create_all(bind=engine)
