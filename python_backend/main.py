"""
贾维斯智能监控系统 - Python FastAPI后端
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
import uvicorn
import logging

# 加载环境变量
load_dotenv()

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 导入路由和服务
from api import router as api_router
from services.data_collector import data_collector
from models.database import init_db

# 创建FastAPI应用
app = FastAPI(
    title="贾维斯智能监控系统",
    description="家庭网络实时监控系统",
    version="2.0.0"
)

# CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册API路由
app.include_router(api_router, prefix="/api")

# 静态文件服务（前端）
# 支持本地开发和Docker环境
frontend_dist = "client/dist" if os.path.exists("client/dist") else "../client/dist"

if os.path.exists(frontend_dist):
    logger.info(f"找到前端构建文件: {frontend_dist}")
    app.mount("/assets", StaticFiles(directory=f"{frontend_dist}/assets"), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """服务前端SPA"""
        file_path = f"{frontend_dist}/{full_path}"
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(f"{frontend_dist}/index.html")
else:
    logger.warning("未找到前端构建文件，只提供API服务")

@app.on_event("startup")
async def startup_event():
    """应用启动事件"""
    logger.info("初始化数据库...")
    init_db()
    logger.info("启动数据收集服务...")
    await data_collector.start()
    logger.info("应用启动完成")

@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭事件"""
    logger.info("停止数据收集服务...")
    await data_collector.stop()
    logger.info("应用已关闭")

@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "ok",
        "message": "贾维斯智能监控系统运行正常",
        "collector_running": data_collector.is_running
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", "3000"))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("NODE_ENV") != "production"
    )
