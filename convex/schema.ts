import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // User roles and permissions
  userProfiles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("staff")),
    name: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Locations/Warehouses
  locations: defineTable({
    name: v.string(),
    address: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }),

  // Product categories
  categories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }),

  // Suppliers
  suppliers: defineTable({
    name: v.string(),
    contactPerson: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }),

  // Products
  products: defineTable({
    name: v.string(),
    sku: v.string(),
    barcode: v.optional(v.string()),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    supplierId: v.optional(v.id("suppliers")),
    unitPrice: v.number(),
    reorderLevel: v.number(),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sku", ["sku"])
    .index("by_barcode", ["barcode"])
    .index("by_category", ["categoryId"])
    .index("by_supplier", ["supplierId"]),

  // Stock levels per location
  stockLevels: defineTable({
    productId: v.id("products"),
    locationId: v.id("locations"),
    quantity: v.number(),
    reservedQuantity: v.number(),
    updatedAt: v.number(),
  })
    .index("by_product", ["productId"])
    .index("by_location", ["locationId"])
    .index("by_product_location", ["productId", "locationId"]),

  // Stock movements (inbound, outbound, adjustments, transfers)
  stockMovements: defineTable({
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
    previousQuantity: v.number(),
    newQuantity: v.number(),
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
    transferToLocationId: v.optional(v.id("locations")),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_product", ["productId"])
    .index("by_location", ["locationId"])
    .index("by_type", ["type"])
    .index("by_created_at", ["createdAt"]),

  // Barcode scan sessions for bulk scanning
  scanSessions: defineTable({
    productId: v.id("products"),
    locationId: v.id("locations"),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("cancelled")),
    totalScanned: v.number(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_user", ["createdBy"]),

  // Individual barcode scans within a session
  barcodeScans: defineTable({
    sessionId: v.id("scanSessions"),
    barcode: v.string(),
    scannedAt: v.number(),
  }).index("by_session", ["sessionId"]),

  // System settings
  settings: defineTable({
    key: v.string(),
    value: v.string(),
    updatedBy: v.id("users"),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
