import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

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

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const products = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get category and supplier info for each product
    const enrichedProducts = await Promise.all(
      products.map(async (product) => {
        const category = product.categoryId
          ? await ctx.db.get(product.categoryId)
          : null;
        const supplier = product.supplierId
          ? await ctx.db.get(product.supplierId)
          : null;

        // Get total stock across all locations
        const stockLevels = await ctx.db
          .query("stockLevels")
          .withIndex("by_product", (q) => q.eq("productId", product._id))
          .collect();

        const totalStock = stockLevels.reduce((sum, level) => sum + level.quantity, 0);

        return {
          ...product,
          category,
          supplier,
          totalStock,
          isLowStock: totalStock <= product.reorderLevel,
        };
      })
    );

    return enrichedProducts;
  },
});

export const getByBarcode = query({
  args: { barcode: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("products")
      .withIndex("by_barcode", (q) => q.eq("barcode", args.barcode))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    barcode: v.optional(v.string()),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    supplierId: v.optional(v.id("suppliers")),
    unitPrice: v.number(),
    reorderLevel: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

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
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.string(),
    barcode: v.optional(v.string()),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    supplierId: v.optional(v.id("suppliers")),
    unitPrice: v.number(),
    reorderLevel: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if barcode already exists for another product
    if (args.barcode) {
      const existingProduct = await ctx.db
        .query("products")
        .withIndex("by_barcode", (q) => q.eq("barcode", args.barcode))
        .first();
      
      if (existingProduct && existingProduct._id !== args.id) {
        throw new Error("Product with this barcode already exists");
      }
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      barcode: args.barcode,
      description: args.description,
      categoryId: args.categoryId,
      supplierId: args.supplierId,
      unitPrice: args.unitPrice,
      reorderLevel: args.reorderLevel,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("products"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

export const getLowStockProducts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const products = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const lowStockProducts = [];

    for (const product of products) {
      const stockLevels = await ctx.db
        .query("stockLevels")
        .withIndex("by_product", (q) => q.eq("productId", product._id))
        .collect();

      const totalStock = stockLevels.reduce((sum, level) => sum + level.quantity, 0);

      if (totalStock <= product.reorderLevel) {
        lowStockProducts.push({
          ...product,
          totalStock,
        });
      }
    }

    return lowStockProducts;
  },
});
