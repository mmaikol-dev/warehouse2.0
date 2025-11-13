import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Generate unique barcodes for a product
export const generateBarcodes = mutation({
  args: {
    productId: v.id("products"),
    locationId: v.id("locations"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (args.quantity <= 0 || args.quantity > 1000) {
      throw new Error("Quantity must be between 1 and 1000");
    }

    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    const location = await ctx.db.get(args.locationId);
    if (!location) throw new Error("Location not found");

    // Generate unique barcodes
    const generatedBarcodes = [];
    const timestamp = Date.now();
    
    for (let i = 0; i < args.quantity; i++) {
      // Create a unique barcode using timestamp, product ID, and sequence
      const sequence = String(i + 1).padStart(4, '0');
      const uniqueId = `${timestamp}${sequence}`;
      const barcode = `${product.sku}${uniqueId.slice(-8)}`;
      generatedBarcodes.push(barcode);
    }

    // Create a scan session for the generated barcodes
    const sessionId = await ctx.db.insert("scanSessions", {
      productId: args.productId,
      locationId: args.locationId,
      status: "completed",
      totalScanned: args.quantity,
      createdBy: userId,
      createdAt: timestamp,
      completedAt: timestamp,
    });

    // Insert all barcode scans
    const scanPromises = generatedBarcodes.map(barcode =>
      ctx.db.insert("barcodeScans", {
        sessionId,
        barcode,
        scannedAt: timestamp,
      })
    );
    await Promise.all(scanPromises);

    // Update stock levels
    let stockLevel = await ctx.db
      .query("stockLevels")
      .withIndex("by_product_location", (q: any) =>
        q.eq("productId", args.productId).eq("locationId", args.locationId)
      )
      .first();

    const previousQuantity = stockLevel?.quantity || 0;
    const newQuantity = previousQuantity + args.quantity;

    if (stockLevel) {
      await ctx.db.patch(stockLevel._id, {
        quantity: newQuantity,
        updatedAt: timestamp,
      });
    } else {
      await ctx.db.insert("stockLevels", {
        productId: args.productId,
        locationId: args.locationId,
        quantity: newQuantity,
        reservedQuantity: 0,
        updatedAt: timestamp,
      });
    }

    // Record stock movement
    await ctx.db.insert("stockMovements", {
      productId: args.productId,
      locationId: args.locationId,
      type: "inbound",
      quantity: args.quantity,
      previousQuantity,
      newQuantity,
      reference: "Barcode Generation",
      notes: `Generated ${args.quantity} unique barcodes`,
      createdBy: userId,
      createdAt: timestamp,
    });

    return {
      sessionId,
      barcodes: generatedBarcodes,
      product,
      location,
      quantity: args.quantity,
    };
  },
});

// Get generated barcodes for a session (for printing)
export const getGeneratedBarcodes = query({
  args: {
    sessionId: v.id("scanSessions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const product = await ctx.db.get(session.productId);
    const location = await ctx.db.get(session.locationId);

    const barcodes = await ctx.db
      .query("barcodeScans")
      .withIndex("by_session", (q: any) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();

    return {
      session,
      product,
      location,
      barcodes: barcodes.map(scan => scan.barcode),
    };
  },
});
