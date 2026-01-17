import { eq, and, gte, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  networkTraffic,
  InsertNetworkTraffic,
  NetworkTraffic,
  onlineDevices,
  InsertOnlineDevice,
  OnlineDevice,
  networkLatency,
  InsertNetworkLatency,
  NetworkLatency,
  routerStatus,
  InsertRouterStatus,
  RouterStatus,
  bandwidthUsage,
  InsertBandwidthUsage,
  BandwidthUsage,
  connectionQuality,
  InsertConnectionQuality,
  ConnectionQuality,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// User operations
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Network Traffic operations
export async function insertNetworkTraffic(data: InsertNetworkTraffic): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(networkTraffic).values(data);
}

export async function getRecentNetworkTraffic(hours: number = 24): Promise<NetworkTraffic[]> {
  const db = await getDb();
  if (!db) return [];

  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return db
    .select()
    .from(networkTraffic)
    .where(gte(networkTraffic.timestamp, cutoff))
    .orderBy(desc(networkTraffic.timestamp))
    .limit(1000);
}

export async function getLatestNetworkTraffic(): Promise<NetworkTraffic | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(networkTraffic)
    .orderBy(desc(networkTraffic.timestamp))
    .limit(1);

  return result[0];
}

// Online Devices operations
export async function upsertOnlineDevice(device: InsertOnlineDevice): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .insert(onlineDevices)
    .values(device)
    .onDuplicateKeyUpdate({
      set: {
        ipAddress: device.ipAddress,
        hostname: device.hostname,
        deviceType: device.deviceType,
        isOnline: device.isOnline,
        lastSeen: device.lastSeen || new Date(),
        uploadSpeed: device.uploadSpeed,
        downloadSpeed: device.downloadSpeed,
        updatedAt: new Date(),
      },
    });
}

export async function getOnlineDevices(): Promise<OnlineDevice[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(onlineDevices)
    .where(eq(onlineDevices.isOnline, 1))
    .orderBy(desc(onlineDevices.lastSeen));
}

export async function getAllDevices(): Promise<OnlineDevice[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(onlineDevices)
    .orderBy(desc(onlineDevices.lastSeen));
}

// Network Latency operations
export async function insertNetworkLatency(data: InsertNetworkLatency): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(networkLatency).values(data);
}

export async function getRecentNetworkLatency(hours: number = 24): Promise<NetworkLatency[]> {
  const db = await getDb();
  if (!db) return [];

  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return db
    .select()
    .from(networkLatency)
    .where(gte(networkLatency.timestamp, cutoff))
    .orderBy(desc(networkLatency.timestamp))
    .limit(1000);
}

export async function getLatestNetworkLatency(): Promise<NetworkLatency[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(networkLatency)
    .orderBy(desc(networkLatency.timestamp))
    .limit(10);
}

// Router Status operations
export async function insertRouterStatus(data: InsertRouterStatus): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(routerStatus).values(data);
}

export async function getRecentRouterStatus(hours: number = 24): Promise<RouterStatus[]> {
  const db = await getDb();
  if (!db) return [];

  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return db
    .select()
    .from(routerStatus)
    .where(gte(routerStatus.timestamp, cutoff))
    .orderBy(desc(routerStatus.timestamp))
    .limit(1000);
}

export async function getLatestRouterStatus(): Promise<RouterStatus | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(routerStatus)
    .orderBy(desc(routerStatus.timestamp))
    .limit(1);

  return result[0];
}

// Bandwidth Usage operations
export async function upsertBandwidthUsage(data: InsertBandwidthUsage): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .insert(bandwidthUsage)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        totalUpload: data.totalUpload,
        totalDownload: data.totalDownload,
        peakUploadSpeed: data.peakUploadSpeed,
        peakDownloadSpeed: data.peakDownloadSpeed,
        updatedAt: new Date(),
      },
    });
}

export async function getBandwidthUsage(days: number = 7): Promise<BandwidthUsage[]> {
  const db = await getDb();
  if (!db) return [];

  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

  return db
    .select()
    .from(bandwidthUsage)
    .where(gte(bandwidthUsage.date, cutoffDateStr))
    .orderBy(desc(bandwidthUsage.date));
}

// Connection Quality operations
export async function insertConnectionQuality(data: InsertConnectionQuality): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(connectionQuality).values(data);
}

export async function getRecentConnectionQuality(hours: number = 24): Promise<ConnectionQuality[]> {
  const db = await getDb();
  if (!db) return [];

  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return db
    .select()
    .from(connectionQuality)
    .where(gte(connectionQuality.timestamp, cutoff))
    .orderBy(desc(connectionQuality.timestamp))
    .limit(1000);
}

export async function getLatestConnectionQuality(): Promise<ConnectionQuality | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(connectionQuality)
    .orderBy(desc(connectionQuality.timestamp))
    .limit(1);

  return result[0];
}

// Data cleanup - delete data older than 7 days
export async function cleanupOldData(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    await Promise.all([
      db.delete(networkTraffic).where(sql`${networkTraffic.timestamp} < ${cutoff}`),
      db.delete(networkLatency).where(sql`${networkLatency.timestamp} < ${cutoff}`),
      db.delete(routerStatus).where(sql`${routerStatus.timestamp} < ${cutoff}`),
      db.delete(connectionQuality).where(sql`${connectionQuality.timestamp} < ${cutoff}`),
    ]);

    console.log('[Database] Old data cleaned up successfully');
  } catch (error) {
    console.error('[Database] Failed to cleanup old data:', error);
  }
}
