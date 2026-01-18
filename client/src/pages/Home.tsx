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

  // Fetch historical data for charts
  const { data: historicalData } = trpc.history.last24Hours.useQuery(undefined, {
    refetchInterval: 60000, // Refetch every minute
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
                家庭网络监控
              </h1>
              <p className="text-muted-foreground text-sm">
                实时监控 · 智能分析 · 数据可视化
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
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground mb-1">国际网络</div>
                <div className="text-2xl font-bold text-primary count-up">
                  {dashboardData?.latency?.[0]?.latency
                    ? `${dashboardData.latency[0].latency.toFixed(1)} ms`
                    : "-- ms"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Google · YouTube · Netflix
                </div>
              </div>
              <div className="border-t border-border/30 pt-3">
                <div className="text-sm text-muted-foreground mb-1">国内网络</div>
                <div className="text-2xl font-bold text-accent count-up">
                  {dashboardData?.latency?.[1]?.latency
                    ? `${dashboardData.latency[1].latency.toFixed(1)} ms`
                    : "-- ms"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  百度 · 阿里
                </div>
              </div>
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

        {/* Historical Trend Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Network Traffic Trend */}
          <Card className="holographic-card glow-cyan-sm p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              网络流量趋势（24小时）
            </h3>
            {historicalData?.networkTraffic && historicalData.networkTraffic.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalData.networkTraffic}>
                  <XAxis
                    dataKey="timestamp"
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                    }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(value) => formatSpeed(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(value) => {
                      const date = new Date(value as number);
                      return date.toLocaleString();
                    }}
                    formatter={(value: number) => [formatSpeed(value), '']}
                  />
                  <Line
                    type="monotone"
                    dataKey="uploadSpeed"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    name="上传速度"
                  />
                  <Line
                    type="monotone"
                    dataKey="downloadSpeed"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={false}
                    name="下载速度"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                正在加载历史数据...
              </div>
            )}
          </Card>

          {/* CPU Usage Trend */}
          <Card className="holographic-card glow-cyan-sm p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" />
              CPU使用率趋势（24小时）
            </h3>
            {historicalData?.routerStatus && historicalData.routerStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalData.routerStatus}>
                  <XAxis
                    dataKey="timestamp"
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                    }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(value) => {
                      const date = new Date(value as number);
                      return date.toLocaleString();
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                  />
                  <Line
                    type="monotone"
                    dataKey="cpuUsage"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    name="CPU使用率"
                  />
                  <Line
                    type="monotone"
                    dataKey="memoryUsage"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={false}
                    name="内存使用率"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                正在加载历史数据...
              </div>
            )}
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 backdrop-blur-sm mt-auto">
        <div className="container py-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>家庭网络监控系统</p>
            <p className="text-xs mt-1">
              实时监控 · 每秒更新数据
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
