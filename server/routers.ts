import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  getRecentNetworkTraffic,
  getLatestNetworkTraffic,
  getOnlineDevices,
  getAllDevices,
  getRecentNetworkLatency,
  getLatestNetworkLatency,
  getRecentRouterStatus,
  getLatestRouterStatus,
  getBandwidthUsage,
  getRecentConnectionQuality,
  getLatestConnectionQuality,
} from "./db";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Network Traffic routes
  networkTraffic: router({
    latest: publicProcedure.query(async () => {
      return await getLatestNetworkTraffic();
    }),
    recent: publicProcedure
      .input(z.object({ hours: z.number().optional().default(24) }))
      .query(async ({ input }) => {
        return await getRecentNetworkTraffic(input.hours);
      }),
  }),

  // Online Devices routes
  devices: router({
    online: publicProcedure.query(async () => {
      return await getOnlineDevices();
    }),
    all: publicProcedure.query(async () => {
      return await getAllDevices();
    }),
  }),

  // Network Latency routes
  latency: router({
    latest: publicProcedure.query(async () => {
      return await getLatestNetworkLatency();
    }),
    recent: publicProcedure
      .input(z.object({ hours: z.number().optional().default(24) }))
      .query(async ({ input }) => {
        return await getRecentNetworkLatency(input.hours);
      }),
  }),

  // Router Status routes
  routerStatus: router({
    latest: publicProcedure.query(async () => {
      return await getLatestRouterStatus();
    }),
    recent: publicProcedure
      .input(z.object({ hours: z.number().optional().default(24) }))
      .query(async ({ input }) => {
        return await getRecentRouterStatus(input.hours);
      }),
  }),

  // Bandwidth Usage routes
  bandwidth: router({
    usage: publicProcedure
      .input(z.object({ days: z.number().optional().default(7) }))
      .query(async ({ input }) => {
        return await getBandwidthUsage(input.days);
      }),
  }),

  // Connection Quality routes
  connectionQuality: router({
    latest: publicProcedure.query(async () => {
      return await getLatestConnectionQuality();
    }),
    recent: publicProcedure
      .input(z.object({ hours: z.number().optional().default(24) }))
      .query(async ({ input }) => {
        return await getRecentConnectionQuality(input.hours);
      }),
  }),

  // Dashboard overview - get all latest data at once
  dashboard: router({
    overview: publicProcedure.query(async () => {
      const [
        networkTraffic,
        onlineDevices,
        latency,
        routerStatus,
        connectionQuality,
      ] = await Promise.all([
        getLatestNetworkTraffic(),
        getOnlineDevices(),
        getLatestNetworkLatency(),
        getLatestRouterStatus(),
        getLatestConnectionQuality(),
      ]);

      return {
        networkTraffic,
        onlineDevices,
        latency,
        routerStatus,
        connectionQuality,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
