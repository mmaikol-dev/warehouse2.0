import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all barcode scans with session and product details
export const getAllBarcodeScans = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 100;
    
    const scans = await ctx.db
      .query("barcodeScans")
      .order("desc")
      .take(limit);

    const enrichedScans = await Promise.all(
      scans.map(async (scan) => {
        const session = await ctx.db.get(scan.sessionId);
        if (!session) return null;

        const product = await ctx.db.get(session.productId);
        const location = await ctx.db.get(session.locationId);
        const user = await ctx.db.get(session.createdBy);

        return {
          ...scan,
          session: {
            ...session,
            product,
            location,
            user,
          },
        };
      })
    );

    return enrichedScans.filter(Boolean);
  },
});

// Get scan sessions with details
export const getScanSessions = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("completed"), v.literal("cancelled"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 50;
    
    let sessions;
    
    if (args.status) {
      sessions = await ctx.db
        .query("scanSessions")
        .withIndex("by_status", (q: any) => q.eq("status", args.status))
        .order("desc")
        .take(limit);
    } else {
      sessions = await ctx.db
        .query("scanSessions")
        .order("desc")
        .take(limit);
    }

    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        const product = await ctx.db.get(session.productId);
        const location = await ctx.db.get(session.locationId);
        const user = await ctx.db.get(session.createdBy);

        const scanCount = await ctx.db
          .query("barcodeScans")
          .withIndex("by_session", (q: any) => q.eq("sessionId", session._id))
          .collect()
          .then(scans => scans.length);

        return {
          ...session,
          product,
          location,
          user,
          actualScanCount: scanCount,
        };
      })
    );

    return enrichedSessions;
  },
});

// Get barcode scan statistics
export const getBarcodeStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const totalScans = await ctx.db
      .query("barcodeScans")
      .collect()
      .then(scans => scans.length);

    const totalSessions = await ctx.db
      .query("scanSessions")
      .collect()
      .then(sessions => sessions.length);

    const activeSessions = await ctx.db
      .query("scanSessions")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .collect()
      .then(sessions => sessions.length);

    const completedSessions = await ctx.db
      .query("scanSessions")
      .withIndex("by_status", (q: any) => q.eq("status", "completed"))
      .collect()
      .then(sessions => sessions.length);

    return {
      totalScans,
      totalSessions,
      activeSessions,
      completedSessions,
    };
  },
});
