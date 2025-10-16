import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Internal stock update for scanner
export const updateStock = internalMutation({
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
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
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
      createdBy: args.userId,
      createdAt: Date.now(),
    });

    return newQuantity;
  },
});

// Generate unique SKU
async function generateSKU(ctx: any): Promise<string> {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  const sku = `SKU${timestamp}${random}`;
  
  // Check if SKU already exists
  const existing = await ctx.db
    .query("products")
    .withIndex("by_sku", (q: any) => q.eq("sku", sku))
    .first();
  
  if (existing) {
    return generateSKU(ctx); // Regenerate if exists
  }
  
  return sku;
}

// Internal product creation for scanner
export const createProduct = internalMutation({
  args: {
    name: v.string(),
    barcode: v.optional(v.string()),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    supplierId: v.optional(v.id("suppliers")),
    unitPrice: v.number(),
    reorderLevel: v.number(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if barcode already exists
    if (args.barcode) {
      const existingProduct = await ctx.db
        .query("products")
        .withIndex("by_barcode", (q) => q.eq("barcode", args.barcode))
        .first();
      
      if (existingProduct) {
        throw new Error("Product with this barcode already exists");
      }
    }

    const sku = await generateSKU(ctx);
    const now = Date.now();

    return await ctx.db.insert("products", {
      name: args.name,
      sku,
      barcode: args.barcode,
      description: args.description,
      categoryId: args.categoryId,
      supplierId: args.supplierId,
      unitPrice: args.unitPrice,
      reorderLevel: args.reorderLevel,
      isActive: true,
      createdBy: args.userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});
