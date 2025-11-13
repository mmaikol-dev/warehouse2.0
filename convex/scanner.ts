import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Single scan mode - increment quantity by 1
export const singleScan = mutation({
  args: {
    barcode: v.string(),
    locationId: v.id("locations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if product exists
    const product = await ctx.db
      .query("products")
      .withIndex("by_barcode", (q: any) => q.eq("barcode", args.barcode))
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .first();

    if (product) {
      // Get current stock level
      let stockLevel = await ctx.db
        .query("stockLevels")
        .withIndex("by_product_location", (q: any) =>
          q.eq("productId", product._id).eq("locationId", args.locationId)
        )
        .first();

      const previousQuantity = stockLevel?.quantity || 0;
      const newQuantity = previousQuantity + 1;

      // Update or create stock level
      if (stockLevel) {
        await ctx.db.patch(stockLevel._id, {
          quantity: newQuantity,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("stockLevels", {
          productId: product._id,
          locationId: args.locationId,
          quantity: newQuantity,
          reservedQuantity: 0,
          updatedAt: Date.now(),
        });
      }

      // Record stock movement
      await ctx.db.insert("stockMovements", {
        productId: product._id,
        locationId: args.locationId,
        type: "inbound",
        quantity: 1,
        previousQuantity,
        newQuantity,
        reference: "Barcode Scan",
        notes: "Single scan increment",
        createdBy: userId,
        createdAt: Date.now(),
      });

      return {
        type: "existing" as const,
        product,
        message: `Added 1 unit of ${product.name}`,
      };
    } else {
      // Create new product
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.random().toString(36).substring(2, 5).toUpperCase();
      const sku = `SKU${timestamp}${random}`;
      const now = Date.now();

      const productId = await ctx.db.insert("products", {
        name: `Product ${args.barcode}`,
        sku,
        barcode: args.barcode,
        unitPrice: 0,
        reorderLevel: 10,
        isActive: true,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });

      const newProduct = await ctx.db.get(productId);

      return {
        type: "new" as const,
        product: newProduct,
        message: `New product created with barcode ${args.barcode}`,
      };
    }
  },
});

// Start bulk scan session
export const startBulkScanSession = mutation({
  args: {
    productId: v.id("products"),
    locationId: v.id("locations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if there's already an active session for this user
    const activeSession = await ctx.db
      .query("scanSessions")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .filter((q: any) => q.eq(q.field("createdBy"), userId))
      .first();

    if (activeSession) {
      throw new Error("You already have an active scan session");
    }

    return await ctx.db.insert("scanSessions", {
      productId: args.productId,
      locationId: args.locationId,
      status: "active",
      totalScanned: 0,
      createdBy: userId,
      createdAt: Date.now(),
    });
  },
});

// Add barcode to bulk scan session
export const addBarcodeToSession = mutation({
  args: {
    sessionId: v.id("scanSessions"),
    barcode: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.createdBy !== userId) {
      throw new Error("Session not found or access denied");
    }

    if (session.status !== "active") {
      throw new Error("Session is not active");
    }

    // Add barcode scan
    await ctx.db.insert("barcodeScans", {
      sessionId: args.sessionId,
      barcode: args.barcode,
      scannedAt: Date.now(),
    });

    // Update session total
    await ctx.db.patch(args.sessionId, {
      totalScanned: session.totalScanned + 1,
    });

    return session.totalScanned + 1;
  },
});

// Get active scan session for user
export const getActiveScanSession = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db
      .query("scanSessions")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .filter((q: any) => q.eq(q.field("createdBy"), userId))
      .first();

    if (!session) return null;

    const product = await ctx.db.get(session.productId);
    const location = await ctx.db.get(session.locationId);

    return {
      ...session,
      product,
      location,
    };
  },
});

// Get scanned barcodes for session
export const getSessionBarcodes = query({
  args: {
    sessionId: v.id("scanSessions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.createdBy !== userId) {
      throw new Error("Session not found or access denied");
    }

    return await ctx.db
      .query("barcodeScans")
      .withIndex("by_session", (q: any) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .collect();
  },
});

// Complete bulk scan session
export const completeBulkScanSession = mutation({
  args: {
    sessionId: v.id("scanSessions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.createdBy !== userId) {
      throw new Error("Session not found or access denied");
    }

    if (session.status !== "active") {
      throw new Error("Session is not active");
    }

    // Update stock with total scanned quantity
    if (session.totalScanned > 0) {
      // Get current stock level
      let stockLevel = await ctx.db
        .query("stockLevels")
        .withIndex("by_product_location", (q: any) =>
          q.eq("productId", session.productId).eq("locationId", session.locationId)
        )
        .first();

      const previousQuantity = stockLevel?.quantity || 0;
      const newQuantity = previousQuantity + session.totalScanned;

      // Update or create stock level
      if (stockLevel) {
        await ctx.db.patch(stockLevel._id, {
          quantity: newQuantity,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("stockLevels", {
          productId: session.productId,
          locationId: session.locationId,
          quantity: newQuantity,
          reservedQuantity: 0,
          updatedAt: Date.now(),
        });
      }

      // Record stock movement
      await ctx.db.insert("stockMovements", {
        productId: session.productId,
        locationId: session.locationId,
        type: "inbound",
        quantity: session.totalScanned,
        previousQuantity,
        newQuantity,
        reference: "Bulk Barcode Scan",
        notes: `Bulk scan session with ${session.totalScanned} items`,
        createdBy: userId,
        createdAt: Date.now(),
      });
    }

    // Mark session as completed
    await ctx.db.patch(args.sessionId, {
      status: "completed",
      completedAt: Date.now(),
    });

    const product = await ctx.db.get(session.productId);

    return {
      product,
      totalScanned: session.totalScanned,
    };
  },
});

// Cancel bulk scan session
export const cancelBulkScanSession = mutation({
  args: {
    sessionId: v.id("scanSessions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.createdBy !== userId) {
      throw new Error("Session not found or access denied");
    }

    await ctx.db.patch(args.sessionId, {
      status: "cancelled",
      completedAt: Date.now(),
    });
  },
});
