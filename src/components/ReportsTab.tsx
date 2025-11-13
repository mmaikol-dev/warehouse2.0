import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export function ReportsTab() {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [dateRange, setDateRange] = useState("7"); // days

  const dashboardStats = useQuery(api.stock.getDashboardStats);
  const lowStockProducts = useQuery(api.products.getLowStockProducts);
  const stockMovements = useQuery(api.stock.getStockMovements, { limit: 100 });
  const locations = useQuery(api.locations.list);
  const stockLevels = useQuery(api.stock.getStockLevels, 
    selectedLocation ? { locationId: selectedLocation as any } : {}
  );

  if (dashboardStats === undefined || lowStockProducts === undefined || stockMovements === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filter movements by date range
  const cutoffDate = Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000;
  const filteredMovements = stockMovements.filter(movement => movement.createdAt >= cutoffDate);

  // Calculate movement statistics
  const movementStats = {
    inbound: filteredMovements.filter(m => m.type === "inbound").length,
    outbound: filteredMovements.filter(m => m.type === "outbound").length,
    adjustments: filteredMovements.filter(m => m.type === "adjustment").length,
    transfers: filteredMovements.filter(m => m.type.includes("transfer")).length,
  };

  // Calculate top products by movement
  const productMovements = filteredMovements.reduce((acc, movement) => {
    const productId = movement.productId;
    if (!acc[productId]) {
      acc[productId] = {
        product: movement.product,
        totalQuantity: 0,
        movementCount: 0,
      };
    }
    acc[productId].totalQuantity += movement.quantity;
    acc[productId].movementCount += 1;
    return acc;
  }, {} as Record<string, any>);

  const topProducts = Object.values(productMovements)
    .sort((a: any, b: any) => b.totalQuantity - a.totalQuantity)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Inventory insights and performance metrics</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">All Locations</option>
            {locations?.map((location) => (
              <option key={location._id} value={location._id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
        <div className="bg-white p-4 lg:p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{dashboardStats.totalProducts}</p>
            </div>
            <div className="text-2xl">📦</div>
          </div>
        </div>

     

        <div className="bg-white p-4 lg:p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-xl lg:text-2xl font-bold text-red-600">{dashboardStats.lowStockCount}</p>
            </div>
            <div className="text-2xl">⚠️</div>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Movements</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{filteredMovements.length}</p>
            </div>
            <div className="text-2xl">📊</div>
          </div>
        </div>
      </div>

      {/* Movement Statistics */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Movement Statistics (Last {dateRange} days)
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xl lg:text-2xl font-bold text-green-600">{movementStats.inbound}</div>
            <div className="text-sm text-gray-600">Inbound</div>
          </div>
          <div className="text-center">
            <div className="text-xl lg:text-2xl font-bold text-red-600">{movementStats.outbound}</div>
            <div className="text-sm text-gray-600">Outbound</div>
          </div>
          <div className="text-center">
            <div className="text-xl lg:text-2xl font-bold text-yellow-600">{movementStats.adjustments}</div>
            <div className="text-sm text-gray-600">Adjustments</div>
          </div>
          <div className="text-center">
            <div className="text-xl lg:text-2xl font-bold text-blue-600">{movementStats.transfers}</div>
            <div className="text-sm text-gray-600">Transfers</div>
          </div>
        </div>
      </div>

      {/* Top Products by Movement */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Top Products by Movement (Last {dateRange} days)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Quantity Moved
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Number of Movements
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topProducts.map((item: any, index) => (
                <tr key={index}>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.product?.name || "Unknown Product"}
                    </div>
                    <div className="text-sm text-gray-500">
                      SKU: {item.product?.sku}
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.totalQuantity}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.movementCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 lg:p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-4">⚠️ Low Stock Alert</h2>
          <div className="space-y-2">
            {lowStockProducts.map((product: any) => (
              <div key={product._id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span className="text-red-700 font-medium">{product.name}</span>
                <span className="text-red-600 text-sm">
                  {product.totalStock} units (reorder at {product.reorderLevel})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Stock Levels by Location */}
      {stockLevels && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Stock Levels {selectedLocation ? `- ${locations?.find(l => l._id === selectedLocation)?.name}` : "(All Locations)"}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stockLevels.slice(0, 20).map((stock: any) => (
                  <tr key={`${stock.productId}-${stock.locationId}`}>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {stock.product?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        SKU: {stock.product?.sku}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stock.location?.name}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stock.quantity}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ksh{((stock.quantity || 0) * (stock.product?.unitPrice || 0)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
