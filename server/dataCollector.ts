import { getIStoreOSClient } from './istoreosClient';
import {
  insertNetworkTraffic,
  upsertOnlineDevice,
  insertNetworkLatency,
  insertRouterStatus,
  upsertBandwidthUsage,
  insertConnectionQuality,
  cleanupOldData,
} from './db';

/**
 * Data Collector Service
 * Periodically collects data from iStoreOS and stores it in the database
 */

class DataCollector {
  private client = getIStoreOSClient();
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;
  private cleanupIntervalId?: NodeJS.Timeout;

  /**
   * Start data collection
   */
  start(intervalMs: number = 1000): void {
    if (this.isRunning) {
      console.log('[DataCollector] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[DataCollector] Starting data collection...');

    // Collect data immediately
    this.collectData();

    // Then collect data at specified interval
    this.intervalId = setInterval(() => {
      this.collectData();
    }, intervalMs);

    // Cleanup old data every hour
    this.cleanupIntervalId = setInterval(() => {
      cleanupOldData();
    }, 60 * 60 * 1000);

    console.log(`[DataCollector] Data collection started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop data collection
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('[DataCollector] Not running');
      return;
    }

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = undefined;
    }

    console.log('[DataCollector] Data collection stopped');
  }

  /**
   * Collect all data from iStoreOS
   */
  private async collectData(): Promise<void> {
    try {
      await Promise.all([
        this.collectNetworkTraffic(),
        this.collectOnlineDevices(),
        this.collectNetworkLatency(),
        this.collectRouterStatus(),
        this.collectConnectionQuality(),
        this.updateBandwidthUsage(),
      ]);
    } catch (error) {
      console.error('[DataCollector] Error collecting data:', error);
    }
  }

  /**
   * Collect network traffic data
   */
  private async collectNetworkTraffic(): Promise<void> {
    try {
      const data = await this.client.getNetworkTraffic();
      await insertNetworkTraffic({
        timestamp: new Date(),
        uploadSpeed: data.uploadSpeed,
        downloadSpeed: data.downloadSpeed,
        totalUpload: data.totalUpload,
        totalDownload: data.totalDownload,
      });
    } catch (error) {
      console.error('[DataCollector] Failed to collect network traffic:', error);
    }
  }

  /**
   * Collect online devices data
   */
  private async collectOnlineDevices(): Promise<void> {
    try {
      const devices = await this.client.getOnlineDevices();
      
      for (const device of devices) {
        await upsertOnlineDevice({
          macAddress: device.macAddress,
          ipAddress: device.ipAddress,
          hostname: device.hostname,
          deviceType: device.deviceType,
          isOnline: 1,
          lastSeen: new Date(),
          uploadSpeed: device.uploadSpeed,
          downloadSpeed: device.downloadSpeed,
        });
      }
    } catch (error) {
      console.error('[DataCollector] Failed to collect online devices:', error);
    }
  }

  /**
   * Collect network latency data
   */
  private async collectNetworkLatency(): Promise<void> {
    try {
      const latencies = await this.client.getNetworkLatency();
      
      for (const latency of latencies) {
        await insertNetworkLatency({
          timestamp: new Date(),
          target: latency.target,
          latency: latency.latency,
          packetLoss: latency.packetLoss,
          jitter: latency.jitter,
        });
      }
    } catch (error) {
      console.error('[DataCollector] Failed to collect network latency:', error);
    }
  }

  /**
   * Collect router status data
   */
  private async collectRouterStatus(): Promise<void> {
    try {
      const status = await this.client.getRouterStatus();
      await insertRouterStatus({
        timestamp: new Date(),
        cpuUsage: status.cpuUsage,
        memoryUsage: status.memoryUsage,
        memoryTotal: status.memoryTotal,
        memoryUsed: status.memoryUsed,
        temperature: status.temperature,
        uptime: status.uptime,
        loadAverage: status.loadAverage,
      });
    } catch (error) {
      console.error('[DataCollector] Failed to collect router status:', error);
    }
  }

  /**
   * Collect connection quality data
   */
  private async collectConnectionQuality(): Promise<void> {
    try {
      const quality = await this.client.getConnectionQuality();
      await insertConnectionQuality({
        timestamp: new Date(),
        signalStrength: quality.signalStrength,
        connectionStability: quality.connectionStability,
        errorRate: quality.errorRate,
        retransmissionRate: quality.retransmissionRate,
      });
    } catch (error) {
      console.error('[DataCollector] Failed to collect connection quality:', error);
    }
  }

  /**
   * Update bandwidth usage statistics
   */
  private async updateBandwidthUsage(): Promise<void> {
    try {
      const traffic = await this.client.getNetworkTraffic();
      const today = new Date().toISOString().split('T')[0];
      
      // Update daily bandwidth usage
      await upsertBandwidthUsage({
        date: today,
        periodType: 'daily',
        totalUpload: traffic.totalUpload,
        totalDownload: traffic.totalDownload,
        peakUploadSpeed: traffic.uploadSpeed,
        peakDownloadSpeed: traffic.downloadSpeed,
      });

      // Update monthly bandwidth usage
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthKey = monthStart.toISOString().split('T')[0];
      
      await upsertBandwidthUsage({
        date: monthKey,
        periodType: 'monthly',
        totalUpload: traffic.totalUpload,
        totalDownload: traffic.totalDownload,
        peakUploadSpeed: traffic.uploadSpeed,
        peakDownloadSpeed: traffic.downloadSpeed,
      });
    } catch (error) {
      console.error('[DataCollector] Failed to update bandwidth usage:', error);
    }
  }
}

// Singleton instance
let dataCollector: DataCollector | null = null;

export function getDataCollector(): DataCollector {
  if (!dataCollector) {
    dataCollector = new DataCollector();
  }
  return dataCollector;
}

// Auto-start data collection when module is loaded
if (process.env.NODE_ENV !== 'test') {
  const collector = getDataCollector();
  collector.start(1000); // Collect data every second
}
