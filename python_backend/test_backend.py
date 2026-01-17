"""
Python后端测试脚本
"""
import sys
import os

# 添加当前目录到Python路径
sys.path.insert(0, os.path.dirname(__file__))

def test_imports():
    """测试所有模块导入"""
    print("🔍 测试模块导入...")
    
    try:
        from models.database import Base, NetworkTraffic, OnlineDevice
        print("✅ models.database 导入成功")
    except Exception as e:
        print(f"❌ models.database 导入失败: {e}")
        return False
    
    try:
        from utils.istoreos_client import IStoreOSClient
        print("✅ utils.istoreos_client 导入成功")
    except Exception as e:
        print(f"❌ utils.istoreos_client 导入失败: {e}")
        return False
    
    try:
        from services.data_collector import DataCollector
        print("✅ services.data_collector 导入成功")
    except Exception as e:
        print(f"❌ services.data_collector 导入失败: {e}")
        return False
    
    try:
        from api import router
        print("✅ api 导入成功")
    except Exception as e:
        print(f"❌ api 导入失败: {e}")
        return False
    
    return True

def test_database_models():
    """测试数据库模型"""
    print("\n🔍 测试数据库模型...")
    
    try:
        from models.database import Base
        tables = Base.metadata.tables.keys()
        print(f"✅ 数据库表定义: {', '.join(tables)}")
        
        expected_tables = {
            'network_traffic', 'online_devices', 'network_latency',
            'router_status', 'bandwidth_usage', 'connection_quality'
        }
        
        if expected_tables.issubset(tables):
            print("✅ 所有必需的表都已定义")
            return True
        else:
            missing = expected_tables - set(tables)
            print(f"❌ 缺少表: {missing}")
            return False
    except Exception as e:
        print(f"❌ 数据库模型测试失败: {e}")
        return False

def main():
    """主测试函数"""
    print("=" * 50)
    print("  贾维斯智能监控系统 - Python后端测试")
    print("=" * 50)
    
    results = []
    
    # 测试导入
    results.append(("模块导入", test_imports()))
    
    # 测试数据库模型
    results.append(("数据库模型", test_database_models()))
    
    # 打印结果
    print("\n" + "=" * 50)
    print("  测试结果")
    print("=" * 50)
    
    for name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{name}: {status}")
    
    all_passed = all(result for _, result in results)
    
    if all_passed:
        print("\n🎉 所有测试通过！Python后端代码结构正确。")
        return 0
    else:
        print("\n⚠️  部分测试失败，请检查错误信息。")
        return 1

if __name__ == "__main__":
    sys.exit(main())
