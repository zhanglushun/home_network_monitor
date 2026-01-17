import axios, { AxiosInstance } from 'axios';

/**
 * iStoreOS API Client
 * Connects to iStoreOS router to fetch network statistics and device information
 */

export interface NetworkTrafficData {
  uploadSpeed: number; // KB/s
  downloadSpeed: number; // KB/s
  totalUpload: number; // bytes
  totalDownload: number; // bytes
}

export interface OnlineDeviceData {
  macAddress: string;
  ipAddress: string;
  hostname?: string;
  deviceType?: string;
  uploadSpeed: number;
  downloadSpeed: number;
}

export interface NetworkLatencyData {
  target: string;
  latency: number; // ms
  packetLoss: number; // percentage
  jitter: number; // ms
}

export interface RouterStatusData {
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  memoryTotal: number; // bytes
  memoryUsed: number; // bytes
  temperature: number; // celsius
  uptime: number; // seconds
  loadAverage: number;
}

export interface ConnectionQualityData {
  signalStrength: number; // percentage
  connectionStability: number; // percentage
  errorRate: number; // percentage
  retransmissionRate: number; // percentage
}

export class IStoreOSClient {
  private client: AxiosInstance;
  private routerIP: string;
  private username: string;
  private password: string;
  private sessionToken?: string;

  constructor(routerIP: string = '192.168.100.1', username: string = 'root', password: string = 'password') {
    this.routerIP = routerIP;
    this.username = username;
    this.password = password;
    
    this.client = axios.create({
      baseURL: `http://${routerIP}`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Authenticate with iStoreOS
   */
  async authenticate(): Promise<boolean> {
    try {
      const response = await this.client.post('/cgi-bin/luci/rpc/auth', {
        id: 1,
        method: 'login',
        params: [this.username, this.password],
      });

      if (response.data && response.data.result) {
        this.sessionToken = response.data.result;
        return true;
      }
      return false;
    } catch (error) {
      console.error('[iStoreOS] Authentication failed:', error);
      return false;
    }
  }

  /**
   * Make authenticated API call
   */
  private async apiCall(method: string, params: any[] = []): Promise<any> {
    if (!this.sessionToken) {
      await this.authenticate();
    }

    try {
      const response = await this.client.post('/cgi-bin/luci/rpc/sys', {
        id: 1,
        method,
        params: [this.sessionToken, ...params],
      });

      return response.data?.result;
    } catch (error) {
      console.error(`[iStoreOS] API call failed: ${method}`, error);
      // Try to re-authenticate and retry once
      await this.authenticate();
      const response = await this.client.post('/cgi-bin/luci/rpc/sys', {
        id: 1,
        method,
        params: [this.sessionToken, ...params],
      });
      return response.data?.result;
    }
  }

  /**
   * Get network traffic data
   */
  async getNetworkTraffic(): Promise<NetworkTrafficData> {
    try {
      // Mock data for now - will be replaced with actual API calls
      // In production, this would call iStoreOS API endpoints
      const data = await this.apiCall('exec', ['cat /proc/net/dev']);
      
      // Parse network interface data
      // For now, return mock data
      return {
        uploadSpeed: Math.random() * 1000 + 500, // Random speed between 500-1500 KB/s
        downloadSpeed: Math.random() * 2000 + 1000, // Random speed between 1000-3000 KB/s
        totalUpload: Math.floor(Math.random() * 1000000000), // Random total
        totalDownload: Math.floor(Math.random() * 5000000000), // Random total
      };
    } catch (error) {
      console.error('[iStoreOS] Failed to get network traffic:', error);
      throw error;
    }
  }

  /**
   * Get online devices
   */
  async getOnlineDevices(): Promise<OnlineDeviceData[]> {
    try {
      // Mock data for now
      const deviceCount = Math.floor(Math.random() * 10) + 15; // 15-25 devices
      const devices: OnlineDeviceData[] = [];
      
      for (let i = 0; i < deviceCount; i++) {
        devices.push({
          macAddress: `00:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}`,
          ipAddress: `192.168.100.${Math.floor(Math.random() * 200) + 10}`,
          hostname: `device-${i + 1}`,
          deviceType: ['phone', 'laptop', 'desktop', 'tablet', 'iot'][Math.floor(Math.random() * 5)],
          uploadSpeed: Math.random() * 100,
          downloadSpeed: Math.random() * 200,
        });
      }
      
      return devices;
    } catch (error) {
      console.error('[iStoreOS] Failed to get online devices:', error);
      throw error;
    }
  }

  /**
   * Get network latency
   */
  async getNetworkLatency(targets: string[] = ['8.8.8.8', '1.1.1.1']): Promise<NetworkLatencyData[]> {
    try {
      const results: NetworkLatencyData[] = [];
      
      for (const target of targets) {
        results.push({
          target,
          latency: Math.random() * 50 + 10, // 10-60ms
          packetLoss: Math.random() * 2, // 0-2%
          jitter: Math.random() * 5, // 0-5ms
        });
      }
      
      return results;
    } catch (error) {
      console.error('[iStoreOS] Failed to get network latency:', error);
      throw error;
    }
  }

  /**
   * Get router status
   */
  async getRouterStatus(): Promise<RouterStatusData> {
    try {
      // Mock data for now
      return {
        cpuUsage: Math.random() * 30 + 5, // 5-35%
        memoryUsage: Math.random() * 20 + 15, // 15-35%
        memoryTotal: 16 * 1024 * 1024 * 1024, // 16GB
        memoryUsed: Math.floor((Math.random() * 0.2 + 0.15) * 16 * 1024 * 1024 * 1024), // 15-35% of 16GB
        temperature: Math.random() * 10 + 40, // 40-50°C
        uptime: Math.floor(Math.random() * 86400 * 7), // 0-7 days in seconds
        loadAverage: Math.random() * 2 + 1, // 1-3
      };
    } catch (error) {
      console.error('[iStoreOS] Failed to get router status:', error);
      throw error;
    }
  }

  /**
   * Get connection quality
   */
  async getConnectionQuality(): Promise<ConnectionQualityData> {
    try {
      // Mock data for now
      return {
        signalStrength: Math.random() * 20 + 75, // 75-95%
        connectionStability: Math.random() * 10 + 88, // 88-98%
        errorRate: Math.random() * 0.5, // 0-0.5%
        retransmissionRate: Math.random() * 1, // 0-1%
      };
    } catch (error) {
      console.error('[iStoreOS] Failed to get connection quality:', error);
      throw error;
    }
  }
}

// Singleton instance
let istoreosClient: IStoreOSClient | null = null;

export function getIStoreOSClient(): IStoreOSClient {
  if (!istoreosClient) {
    istoreosClient = new IStoreOSClient();
  }
  return istoreosClient;
}
