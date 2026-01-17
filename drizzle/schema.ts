import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Network traffic data table
 * Stores real-time upload/download speeds and total traffic
 */
export const networkTraffic = mysqlTable("network_traffic", {
  id: int("id").autoincrement().primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  uploadSpeed: float("upload_speed").notNull(), // KB/s
  downloadSpeed: float("download_speed").notNull(), // KB/s
  totalUpload: bigint("total_upload", { mode: "number" }).notNull(), // Total bytes uploaded
  totalDownload: bigint("total_download", { mode: "number" }).notNull(), // Total bytes downloaded
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type NetworkTraffic = typeof networkTraffic.$inferSelect;
export type InsertNetworkTraffic = typeof networkTraffic.$inferInsert;

/**
 * Online devices table
 * Stores information about devices connected to the network
 */
export const onlineDevices = mysqlTable("online_devices", {
  id: int("id").autoincrement().primaryKey(),
  macAddress: varchar("mac_address", { length: 64 }).notNull(),
  ipAddress: varchar("ip_address", { length: 64 }).notNull(),
  hostname: text("hostname"),
  deviceType: varchar("device_type", { length: 64 }), // phone, laptop, desktop, etc.
  isOnline: int("is_online").default(1).notNull(), // 1 = online, 0 = offline
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
  uploadSpeed: float("upload_speed").default(0).notNull(), // KB/s
  downloadSpeed: float("download_speed").default(0).notNull(), // KB/s
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type OnlineDevice = typeof onlineDevices.$inferSelect;
export type InsertOnlineDevice = typeof onlineDevices.$inferInsert;

/**
 * Network latency data table
 * Stores ping latency and packet loss information
 */
export const networkLatency = mysqlTable("network_latency", {
  id: int("id").autoincrement().primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  target: varchar("target", { length: 255 }).notNull(), // Target IP or domain
  latency: float("latency").notNull(), // ms
  packetLoss: float("packet_loss").default(0).notNull(), // percentage
  jitter: float("jitter").default(0).notNull(), // ms
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type NetworkLatency = typeof networkLatency.$inferSelect;
export type InsertNetworkLatency = typeof networkLatency.$inferInsert;

/**
 * Router status table
 * Stores CPU, memory, temperature and other system metrics
 */
export const routerStatus = mysqlTable("router_status", {
  id: int("id").autoincrement().primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  cpuUsage: float("cpu_usage").notNull(), // percentage
  memoryUsage: float("memory_usage").notNull(), // percentage
  memoryTotal: bigint("memory_total", { mode: "number" }).notNull(), // bytes
  memoryUsed: bigint("memory_used", { mode: "number" }).notNull(), // bytes
  temperature: float("temperature").default(0).notNull(), // celsius
  uptime: bigint("uptime", { mode: "number" }).notNull(), // seconds
  loadAverage: float("load_average").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type RouterStatus = typeof routerStatus.$inferSelect;
export type InsertRouterStatus = typeof routerStatus.$inferInsert;

/**
 * Bandwidth usage statistics table
 * Stores daily and monthly bandwidth usage
 */
export const bandwidthUsage = mysqlTable("bandwidth_usage", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  periodType: mysqlEnum("period_type", ["daily", "monthly"]).notNull(),
  totalUpload: bigint("total_upload", { mode: "number" }).notNull(), // bytes
  totalDownload: bigint("total_download", { mode: "number" }).notNull(), // bytes
  peakUploadSpeed: float("peak_upload_speed").default(0).notNull(), // KB/s
  peakDownloadSpeed: float("peak_download_speed").default(0).notNull(), // KB/s
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type BandwidthUsage = typeof bandwidthUsage.$inferSelect;
export type InsertBandwidthUsage = typeof bandwidthUsage.$inferInsert;

/**
 * Connection quality table
 * Stores signal strength and connection stability metrics
 */
export const connectionQuality = mysqlTable("connection_quality", {
  id: int("id").autoincrement().primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  signalStrength: float("signal_strength").notNull(), // percentage or dBm
  connectionStability: float("connection_stability").notNull(), // percentage
  errorRate: float("error_rate").default(0).notNull(), // percentage
  retransmissionRate: float("retransmission_rate").default(0).notNull(), // percentage
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ConnectionQuality = typeof connectionQuality.$inferSelect;
export type InsertConnectionQuality = typeof connectionQuality.$inferInsert;
