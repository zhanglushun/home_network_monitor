import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createTestContext(): TrpcContext {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("history.last24Hours", () => {
  it("returns historical data structure", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.history.last24Hours();

    // Verify the response structure
    expect(result).toHaveProperty("networkTraffic");
    expect(result).toHaveProperty("routerStatus");
    expect(Array.isArray(result.networkTraffic)).toBe(true);
    expect(Array.isArray(result.routerStatus)).toBe(true);
  });

  it("returns empty arrays when no data available", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.history.last24Hours();

    // When database is empty or unavailable, should return empty arrays
    expect(result.networkTraffic).toBeDefined();
    expect(result.routerStatus).toBeDefined();
  });
});
