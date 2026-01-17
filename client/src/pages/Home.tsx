import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Activity, Cpu, HardDrive, Network, Signal, Users, Zap } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch dashboard data with real-time updates
  const { data: dashboardData, refetch } = trpc.dashboard.overview.useQuery(undefined, {
    refetchInterval: 1000, // Refetch every second for real-time updates
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatSpeed = (kbps: number): string => {
    if (kbps < 1024) return `${kbps.toFixed(1)} KB/s`;
    return `${(kbps / 1024).toFixed(2)} MB/s`;
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-background grid-background scanline-container">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold neon-text mb-2">
                贾维斯智能监控系统
              </h1>
              <p className="text-muted-foreground text-sm">
                家庭网络实时监控 · 智能分析 · 全息展示
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono neon-text">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-sm text-muted-foreground">
                {currentTime.toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Network Traffic Card */}
          <Card className="holographic-card glow-cyan-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-primary/20 glow-cyan-sm">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">网络流量</h3>
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-muted-foreground">上传速度</div>
                <div className="text-2xl font-bold text-primary count-up">
                  {dashboardData?.networkTraffic
                    ? formatSpeed(dashboardData.networkTraffic.uploadSpeed)
                    : "0 KB/s"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">下载速度</div>
                <div className="text-2xl font-bold text-accent count-up">
                  {dashboardData?.networkTraffic
                    ? formatSpeed(dashboardData.networkTraffic.downloadSpeed)
                    : "0 KB/s"}
                </div>
              </div>
            </div>
          </Card>

          {/* Online Devices Card */}
          <Card className="holographic-card glow-cyan-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-primary/20 glow-cyan-sm">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">在线设备</h3>
            </div>
            <div className="text-5xl font-bold text-primary count-up">
              {dashboardData?.onlineDevices?.length || 0}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              台设备在线
            </div>
          </Card>

          {/* Network Latency Card */}
          <Card className="holographic-card glow-cyan-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-primary/20 glow-cyan-sm">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">网络延迟</h3>
            </div>
            <div className="space-y-2">
              {dashboardData?.latency?.slice(0, 2).map((lat, idx) => (
                <div key={idx}>
                  <div className="text-sm text-muted-foreground">{lat.target}</div>
                  <div className="text-xl font-bold text-primary count-up">
                    {lat.latency.toFixed(1)} ms
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Router Status Card */}
          <Card className="holographic-card glow-cyan-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-primary/20 glow-cyan-sm">
                <Cpu className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">路由器状态</h3>
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-muted-foreground">CPU使用率</div>
                <div className="text-xl font-bold text-primary count-up">
                  {dashboardData?.routerStatus
                    ? `${dashboardData.routerStatus.cpuUsage.toFixed(1)}%`
                    : "0%"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">内存使用率</div>
                <div className="text-xl font-bold text-accent count-up">
                  {dashboardData?.routerStatus
                    ? `${dashboardData.routerStatus.memoryUsage.toFixed(1)}%`
                    : "0%"}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Router Detailed Status */}
          <Card className="holographic-card glow-cyan-sm p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" />
              系统资源
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">CPU使用率</span>
                <span className="text-lg font-bold text-primary">
                  {dashboardData?.routerStatus
                    ? `${dashboardData.routerStatus.cpuUsage.toFixed(1)}%`
                    : "0%"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">内存使用率</span>
                <span className="text-lg font-bold text-primary">
                  {dashboardData?.routerStatus
                    ? `${dashboardData.routerStatus.memoryUsage.toFixed(1)}%`
                    : "0%"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">设备温度</span>
                <span className="text-lg font-bold text-primary">
                  {dashboardData?.routerStatus
                    ? `${dashboardData.routerStatus.temperature.toFixed(1)}°C`
                    : "0°C"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">运行时间</span>
                <span className="text-lg font-bold text-primary">
                  {dashboardData?.routerStatus
                    ? formatUptime(dashboardData.routerStatus.uptime)
                    : "0d 0h 0m"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">负载平均值</span>
                <span className="text-lg font-bold text-primary">
                  {dashboardData?.routerStatus
                    ? dashboardData.routerStatus.loadAverage.toFixed(2)
                    : "0.00"}
                </span>
              </div>
            </div>
          </Card>

          {/* Connection Quality */}
          <Card className="holographic-card glow-cyan-sm p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Signal className="w-5 h-5 text-primary" />
              连接质量
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">信号强度</span>
                <span className="text-lg font-bold text-primary">
                  {dashboardData?.connectionQuality
                    ? `${dashboardData.connectionQuality.signalStrength.toFixed(1)}%`
                    : "0%"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">连接稳定性</span>
                <span className="text-lg font-bold text-primary">
                  {dashboardData?.connectionQuality
                    ? `${dashboardData.connectionQuality.connectionStability.toFixed(1)}%`
                    : "0%"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">错误率</span>
                <span className="text-lg font-bold text-destructive">
                  {dashboardData?.connectionQuality
                    ? `${dashboardData.connectionQuality.errorRate.toFixed(2)}%`
                    : "0%"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">重传率</span>
                <span className="text-lg font-bold text-destructive">
                  {dashboardData?.connectionQuality
                    ? `${dashboardData.connectionQuality.retransmissionRate.toFixed(2)}%`
                    : "0%"}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Online Devices List */}
        <Card className="holographic-card glow-cyan-sm p-6">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Network className="w-5 h-5 text-primary" />
            已连接设备
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData?.onlineDevices?.map((device, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-muted/50 border border-primary/20 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-primary pulse-glow" />
                  <div className="font-mono text-sm text-primary">
                    {device.ipAddress}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mb-1">
                  {device.hostname || "未知设备"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {device.macAddress}
                </div>
                <div className="mt-2 flex gap-4 text-xs">
                  <span className="text-primary">
                    ↑ {formatSpeed(device.uploadSpeed)}
                  </span>
                  <span className="text-accent">
                    ↓ {formatSpeed(device.downloadSpeed)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 backdrop-blur-sm mt-auto">
        <div className="container py-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>家庭网络监控系统 · 贾维斯智能助手驱动</p>
            <p className="text-xs mt-1">
              实时监控 · 每秒更新数据
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
