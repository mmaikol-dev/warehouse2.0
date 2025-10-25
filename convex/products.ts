import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const products = await ctx.db
      .query("products")
      .order("desc")
      .collect();

    // Enrich products with category information
    const enrichedProducts = await Promise.all(
      products.map(async (product) => {
        const category = product.categoryId 
          ? await ctx.db.get(product.categoryId)
          : null;
        
        return {
          ...product,
          category,
        };
      })
    );

    return enrichedProducts;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    sku: v.string(),
    barcode: v.optional(v.string()),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    unitPrice: v.number(),
    reorderLevel: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if SKU already exists
    const existingSku = await ctx.db
      .query("products")
      .withIndex("by_sku", (q: any) => q.eq("sku", args.sku))
      .first();

    if (existingSku) {
      throw new Error("A product with this SKU already exists");
    }

    // Check if barcode already exists (if provided)
    if (args.barcode) {
      const existingBarcode = await ctx.db
        .query("products")
        .withIndex("by_barcode", (q: any) => q.eq("barcode", args.barcode))
        .first();

      if (existingBarcode) {
        throw new Error("A product with this barcode already exists");
      }
    }

    const now = Date.now();
    return await ctx.db.insert("products", {
      name: args.name,
      sku: args.sku,
      barcode: args.barcode,
      description: args.description,
      categoryId: args.categoryId,
      unitPrice: args.unitPrice,
      reorderLevel: args.reorderLevel,
      isActive: args.isActive,
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
    sku: v.string(),
    barcode: v.optional(v.string()),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    unitPrice: v.number(),
    reorderLevel: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const product = await ctx.db.get(args.id);
    if (!product) throw new Error("Product not found");

    // Check if SKU already exists (excluding current product)
    const existingSku = await ctx.db
      .query("products")
      .withIndex("by_sku", (q: any) => q.eq("sku", args.sku))
      .filter((q: any) => q.neq(q.field("_id"), args.id))
      .first();

    if (existingSku) {
      throw new Error("A product with this SKU already exists");
    }

    // Check if barcode already exists (if provided, excluding current product)
    if (args.barcode) {
      const existingBarcode = await ctx.db
        .query("products")
        .withIndex("by_barcode", (q: any) => q.eq("barcode", args.barcode))
        .filter((q: any) => q.neq(q.field("_id"), args.id))
        .first();

      if (existingBarcode) {
        throw new Error("A product with this barcode already exists");
      }
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      sku: args.sku,
      barcode: args.barcode,
      description: args.description,
      categoryId: args.categoryId,
      unitPrice: args.unitPrice,
      reorderLevel: args.reorderLevel,
      isActive: args.isActive,
      updatedAt: Date.now(),
    });
  },
});

export const get = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const product = await ctx.db.get(args.id);
    if (!product) return null;

    const category = product.categoryId 
      ? await ctx.db.get(product.categoryId)
      : null;

    return {
      ...product,
      category,
    };
  },
});

export const getLowStockProducts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const products = await ctx.db
      .query("products")
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .collect();

    const lowStockProducts = [];

    for (const product of products) {
      // Get total stock across all locations
      const stockLevels = await ctx.db
        .query("stockLevels")
        .withIndex("by_product", (q: any) => q.eq("productId", product._id))
        .collect();

      const totalStock = stockLevels.reduce((sum, stock) => sum + stock.quantity, 0);

      if (totalStock <= product.reorderLevel) {
        lowStockProducts.push({
          ...product,
          totalStock,
        });
      }
    }

    return lowStockProducts.sort((a, b) => a.totalStock - b.totalStock);
  },
});

export const searchByBarcode = query({
  args: { barcode: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const product = await ctx.db
      .query("products")
      .withIndex("by_barcode", (q: any) => q.eq("barcode", args.barcode))
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .first();

    if (!product) return null;

    const category = product.categoryId 
      ? await ctx.db.get(product.categoryId)
      : null;

    return {
      ...product,
      category,
    };
  },
});
