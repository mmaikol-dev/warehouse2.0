/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as barcodeGenerator from "../barcodeGenerator.js";
import type * as barcodes from "../barcodes.js";
import type * as categories from "../categories.js";
import type * as http from "../http.js";
import type * as internal_ from "../internal.js";
import type * as locations from "../locations.js";
import type * as products from "../products.js";
import type * as router from "../router.js";
import type * as scanner from "../scanner.js";
import type * as stock from "../stock.js";
import type * as suppliers from "../suppliers.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  barcodeGenerator: typeof barcodeGenerator;
  barcodes: typeof barcodes;
  categories: typeof categories;
  http: typeof http;
  internal: typeof internal_;
  locations: typeof locations;
  products: typeof products;
  router: typeof router;
  scanner: typeof scanner;
  stock: typeof stock;
  suppliers: typeof suppliers;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
