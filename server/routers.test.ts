import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Network Monitor API", () => {
  it("should return dashboard overview", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.overview();

    expect(result).toBeDefined();
    expect(result).toHaveProperty("networkTraffic");
    expect(result).toHaveProperty("onlineDevices");
    expect(result).toHaveProperty("latency");
    expect(result).toHaveProperty("routerStatus");
    expect(result).toHaveProperty("connectionQuality");
  });

  it("should return latest network traffic", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.networkTraffic.latest();

    // Result can be undefined if no data exists yet
    if (result) {
      expect(result).toHaveProperty("uploadSpeed");
      expect(result).toHaveProperty("downloadSpeed");
      expect(result).toHaveProperty("totalUpload");
      expect(result).toHaveProperty("totalDownload");
    }
  });

  it("should return online devices", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.devices.online();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should return latest network latency", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.latency.latest();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should return latest router status", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.routerStatus.latest();

    // Result can be undefined if no data exists yet
    if (result) {
      expect(result).toHaveProperty("cpuUsage");
      expect(result).toHaveProperty("memoryUsage");
      expect(result).toHaveProperty("temperature");
      expect(result).toHaveProperty("uptime");
    }
  });

  it("should return latest connection quality", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.connectionQuality.latest();

    // Result can be undefined if no data exists yet
    if (result) {
      expect(result).toHaveProperty("signalStrength");
      expect(result).toHaveProperty("connectionStability");
      expect(result).toHaveProperty("errorRate");
      expect(result).toHaveProperty("retransmissionRate");
    }
  });

  it("should return bandwidth usage for last 7 days", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bandwidth.usage({ days: 7 });

    expect(Array.isArray(result)).toBe(true);
  });
});
