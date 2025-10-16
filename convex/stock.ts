import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getStockLevels = query({
  args: {
    locationId: v.optional(v.id("locations")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let stockLevels;
    if (args.locationId) {
      stockLevels = await ctx.db
        .query("stockLevels")
        .withIndex("by_location", (q: any) => q.eq("locationId", args.locationId))
        .collect();
    } else {
      stockLevels = await ctx.db.query("stockLevels").collect();
    }

    const enrichedStockLevels = await Promise.all(
      stockLevels.map(async (stock) => {
        const product = await ctx.db.get(stock.productId);
        const location = await ctx.db.get(stock.locationId);
        return {
          ...stock,
          product,
          location,
        };
      })
    );

    return enrichedStockLevels;
  },
});

export const updateStock = mutation({
  args: {
    productId: v.id("products"),
    locationId: v.id("locations"),
    type: v.union(
      v.literal("inbound"),
      v.literal("outbound"),
      v.literal("adjustment"),
      v.literal("transfer_out"),
      v.literal("transfer_in")
    ),
    quantity: v.number(),
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
    transferToLocationId: v.optional(v.id("locations")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get current stock level
    let stockLevel = await ctx.db
      .query("stockLevels")
      .withIndex("by_product_location", (q) =>
        q.eq("productId", args.productId).eq("locationId", args.locationId)
      )
      .first();

    const previousQuantity = stockLevel?.quantity || 0;
    let newQuantity = previousQuantity;

    // Calculate new quantity based on movement type
    switch (args.type) {
      case "inbound":
      case "transfer_in":
        newQuantity = previousQuantity + args.quantity;
        break;
      case "outbound":
      case "transfer_out":
        newQuantity = Math.max(0, previousQuantity - args.quantity);
        break;
      case "adjustment":
        newQuantity = args.quantity; // Direct set for adjustments
        break;
    }

    // Update or create stock level
    if (stockLevel) {
      await ctx.db.patch(stockLevel._id, {
        quantity: newQuantity,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("stockLevels", {
        productId: args.productId,
        locationId: args.locationId,
        quantity: newQuantity,
        reservedQuantity: 0,
        updatedAt: Date.now(),
      });
    }

    // Record stock movement
    await ctx.db.insert("stockMovements", {
      productId: args.productId,
      locationId: args.locationId,
      type: args.type,
      quantity: args.quantity,
      previousQuantity,
      newQuantity,
      reference: args.reference,
      notes: args.notes,
      transferToLocationId: args.transferToLocationId,
      createdBy: userId,
      createdAt: Date.now(),
    });

    // Handle transfer - we'll handle the destination update separately
    // The transfer_in will be handled by a separate call from the client

    return newQuantity;
  },
});

export const getStockMovements = query({
  args: {
    productId: v.optional(v.id("products")),
    locationId: v.optional(v.id("locations")),
    type: v.optional(
      v.union(
        v.literal("inbound"),
        v.literal("outbound"),
        v.literal("adjustment"),
        v.literal("transfer_out"),
        v.literal("transfer_in")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let movements;
    
    if (args.productId) {
      movements = await ctx.db
        .query("stockMovements")
        .withIndex("by_product", (q: any) => q.eq("productId", args.productId))
        .order("desc")
        .take(args.limit || 50);
    } else if (args.locationId) {
      movements = await ctx.db
        .query("stockMovements")
        .withIndex("by_location", (q: any) => q.eq("locationId", args.locationId))
        .order("desc")
        .take(args.limit || 50);
    } else if (args.type) {
      movements = await ctx.db
        .query("stockMovements")
        .withIndex("by_type", (q: any) => q.eq("type", args.type))
        .order("desc")
        .take(args.limit || 50);
    } else {
      movements = await ctx.db
        .query("stockMovements")
        .order("desc")
        .take(args.limit || 50);
    }

    const enrichedMovements = await Promise.all(
      movements.map(async (movement) => {
        const product = await ctx.db.get(movement.productId);
        const location = await ctx.db.get(movement.locationId);
        const user = await ctx.db.get(movement.createdBy);
        const transferToLocation = movement.transferToLocationId
          ? await ctx.db.get(movement.transferToLocationId)
          : null;

        return {
          ...movement,
          product,
          location,
          user,
          transferToLocation,
        };
      })
    );

    return enrichedMovements;
  },
});

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get total products
    const products = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get all stock levels
    const stockLevels = await ctx.db.query("stockLevels").collect();

    // Calculate total stock value
    let totalStockValue = 0;
    let totalProducts = products.length;
    let lowStockCount = 0;

    for (const product of products) {
      const productStockLevels = stockLevels.filter(
        (level) => level.productId === product._id
      );
      const totalStock = productStockLevels.reduce(
        (sum, level) => sum + level.quantity,
        0
      );

      totalStockValue += totalStock * product.unitPrice;

      if (totalStock <= product.reorderLevel) {
        lowStockCount++;
      }
    }

    // Get recent movements (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentMovements = await ctx.db
      .query("stockMovements")
      .withIndex("by_created_at", (q) => q.gte("createdAt", sevenDaysAgo))
      .collect();

    return {
      totalProducts,
      totalStockValue,
      lowStockCount,
      recentMovementsCount: recentMovements.length,
    };
  },
});
