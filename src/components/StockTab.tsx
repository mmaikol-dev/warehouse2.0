import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function StockTab() {
  const [showForm, setShowForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  
  // Stock Levels filters and pagination
  const [stockSearchTerm, setStockSearchTerm] = useState("");
  const [stockStatusFilter, setStockStatusFilter] = useState<"all" | "low_stock" | "in_stock">("all");
  const [stockCurrentPage, setStockCurrentPage] = useState(1);
  const stockItemsPerPage = 10;

  // Stock Movements filters and pagination
  const [movementSearchTerm, setMovementSearchTerm] = useState("");
  const [movementTypeFilter, setMovementTypeFilter] = useState<"all" | "inbound" | "outbound" | "adjustment" | "transfer_out" | "transfer_in">("all");
  const [movementLocationFilter, setMovementLocationFilter] = useState("");
  const [movementCurrentPage, setMovementCurrentPage] = useState(1);
  const movementItemsPerPage = 10;

  const stockLevels = useQuery(api.stock.getStockLevels, 
    selectedLocation ? { locationId: selectedLocation as any } : {}
  );
  const locations = useQuery(api.locations.list);
  const stockMovements = useQuery(api.stock.getStockMovements, { limit: 100 });

  // Filter stock levels
  const filteredStockLevels = stockLevels?.filter(stock => {
    const matchesSearch = !stockSearchTerm || 
      stock.product?.name.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
      stock.product?.sku.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
      stock.location?.name.toLowerCase().includes(stockSearchTerm.toLowerCase());
    
    const isLowStock = stock.quantity <= (stock.product?.reorderLevel || 0);
    const matchesStatus = stockStatusFilter === "all" || 
      (stockStatusFilter === "low_stock" && isLowStock) ||
      (stockStatusFilter === "in_stock" && !isLowStock);
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Filter stock movements
  const filteredStockMovements = stockMovements?.filter(movement => {
    const matchesSearch = !movementSearchTerm || 
      movement.product?.name.toLowerCase().includes(movementSearchTerm.toLowerCase()) ||
      movement.product?.sku.toLowerCase().includes(movementSearchTerm.toLowerCase()) ||
      movement.reference?.toLowerCase().includes(movementSearchTerm.toLowerCase());
    
    const matchesType = movementTypeFilter === "all" || movement.type === movementTypeFilter;
    const matchesLocation = !movementLocationFilter || movement.locationId === movementLocationFilter;
    
    return matchesSearch && matchesType && matchesLocation;
  }) || [];

  // Stock levels pagination
  const stockTotalPages = Math.ceil(filteredStockLevels.length / stockItemsPerPage);
  const stockStartIndex = (stockCurrentPage - 1) * stockItemsPerPage;
  const stockEndIndex = stockStartIndex + stockItemsPerPage;
  const currentStockLevels = filteredStockLevels.slice(stockStartIndex, stockEndIndex);

  // Stock movements pagination
  const movementTotalPages = Math.ceil(filteredStockMovements.length / movementItemsPerPage);
  const movementStartIndex = (movementCurrentPage - 1) * movementItemsPerPage;
  const movementEndIndex = movementStartIndex + movementItemsPerPage;
  const currentStockMovements = filteredStockMovements.slice(movementStartIndex, movementEndIndex);

  // Reset pagination when filters change
  const handleStockSearchChange = (value: string) => {
    setStockSearchTerm(value);
    setStockCurrentPage(1);
  };

  const handleStockStatusChange = (value: string) => {
    setStockStatusFilter(value as any);
    setStockCurrentPage(1);
  };

  const handleMovementSearchChange = (value: string) => {
    setMovementSearchTerm(value);
    setMovementCurrentPage(1);
  };

  const handleMovementTypeChange = (value: string) => {
    setMovementTypeFilter(value as any);
    setMovementCurrentPage(1);
  };

  const handleMovementLocationChange = (value: string) => {
    setMovementLocationFilter(value);
    setMovementCurrentPage(1);
  };

  if (stockLevels === undefined || locations === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
          <p className="text-gray-600">Track and manage inventory levels</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">All Locations</option>
            {locations.map((location) => (
              <option key={location._id} value={location._id}>
                {location.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
          >
            Stock Movement
          </button>
        </div>
      </div>

      {/* Stock Levels */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Stock Levels</h2>
          
          {/* Stock Levels Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Stock
              </label>
              <input
                type="text"
                value={stockSearchTerm}
                onChange={(e) => handleStockSearchChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Search by product name, SKU, or location..."
              />
            </div>
            <div className="sm:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={stockStatusFilter}
                onChange={(e) => handleStockStatusChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Status</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-3 text-sm text-gray-600">
            {stockSearchTerm || stockStatusFilter !== "all" ? (
              <>
                Showing {filteredStockLevels.length} of {stockLevels.length} stock entries
                {stockSearchTerm && ` matching "${stockSearchTerm}"`}
                {stockStatusFilter !== "all" && ` with ${stockStatusFilter.replace("_", " ")} status`}
              </>
            ) : (
              `Showing ${stockLevels.length} stock entries`
            )}
          </div>
        </div>

        {filteredStockLevels.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {stockSearchTerm || stockStatusFilter !== "all" ? "No stock entries found" : "No stock entries yet"}
            </h3>
            <p className="text-gray-500">
              {stockSearchTerm || stockStatusFilter !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "Stock entries will appear here once you add products to locations"
              }
            </p>
          </div>
        ) : (
          <>
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
                      Reserved
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentStockLevels.map((stock) => {
                    const available = stock.quantity - stock.reservedQuantity;
                    const isLowStock = stock.quantity <= (stock.product?.reorderLevel || 0);
                    
                    return (
                      <tr key={`${stock.productId}-${stock.locationId}`} className="hover:bg-gray-50">
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
                          {stock.reservedQuantity}
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {available}
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          {isLowStock ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              In Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Stock Levels Pagination */}
            {stockTotalPages > 1 && (
              <div className="px-4 lg:px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Showing {stockStartIndex + 1} to {Math.min(stockEndIndex, filteredStockLevels.length)} of {filteredStockLevels.length} results
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setStockCurrentPage(stockCurrentPage - 1)}
                      disabled={stockCurrentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <div className="flex space-x-1">
                      {Array.from({ length: stockTotalPages }, (_, i) => i + 1).map((page) => {
                        const showPage = 
                          page === 1 || 
                          page === stockTotalPages || 
                          (page >= stockCurrentPage - 1 && page <= stockCurrentPage + 1);
                        
                        if (!showPage) {
                          if (page === stockCurrentPage - 2 || page === stockCurrentPage + 2) {
                            return (
                              <span key={page} className="px-3 py-2 text-sm text-gray-500">
                                ...
                              </span>
                            );
                          }
                          return null;
                        }

                        return (
                          <button
                            key={page}
                            onClick={() => setStockCurrentPage(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              stockCurrentPage === page
                                ? "bg-blue-600 text-white"
                                : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setStockCurrentPage(stockCurrentPage + 1)}
                      disabled={stockCurrentPage === stockTotalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Recent Movements */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Stock Movements</h2>
          
          {/* Stock Movements Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Movements
              </label>
              <input
                type="text"
                value={movementSearchTerm}
                onChange={(e) => handleMovementSearchChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Search by product name, SKU, or reference..."
              />
            </div>
            <div className="sm:w-40">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={movementTypeFilter}
                onChange={(e) => handleMovementTypeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Types</option>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
                <option value="adjustment">Adjustment</option>
                <option value="transfer_out">Transfer Out</option>
                <option value="transfer_in">Transfer In</option>
              </select>
            </div>
            <div className="sm:w-40">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                value={movementLocationFilter}
                onChange={(e) => handleMovementLocationChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">All Locations</option>
                {locations.map((location) => (
                  <option key={location._id} value={location._id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-3 text-sm text-gray-600">
            {movementSearchTerm || movementTypeFilter !== "all" || movementLocationFilter ? (
              <>
                Showing {filteredStockMovements.length} of {stockMovements?.length || 0} movements
                {movementSearchTerm && ` matching "${movementSearchTerm}"`}
                {movementTypeFilter !== "all" && ` of type ${movementTypeFilter.replace("_", " ")}`}
                {movementLocationFilter && ` in selected location`}
              </>
            ) : (
              `Showing ${stockMovements?.length || 0} movements`
            )}
          </div>
        </div>

        {filteredStockMovements.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {movementSearchTerm || movementTypeFilter !== "all" || movementLocationFilter ? "No movements found" : "No stock movements yet"}
            </h3>
            <p className="text-gray-500">
              {movementSearchTerm || movementTypeFilter !== "all" || movementLocationFilter
                ? "Try adjusting your search or filter criteria"
                : "Stock movements will appear here once you record inventory changes"
              }
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentStockMovements.map((movement) => (
                    <tr key={movement._id} className="hover:bg-gray-50">
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(movement.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {movement.product?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          SKU: {movement.product?.sku}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          movement.type === "inbound" ? "bg-green-100 text-green-800" :
                          movement.type === "outbound" ? "bg-red-100 text-red-800" :
                          movement.type === "adjustment" ? "bg-yellow-100 text-yellow-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>
                          {movement.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.type === "outbound" ? "-" : "+"}{movement.quantity}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.location?.name}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {movement.reference || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Stock Movements Pagination */}
            {movementTotalPages > 1 && (
              <div className="px-4 lg:px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Showing {movementStartIndex + 1} to {Math.min(movementEndIndex, filteredStockMovements.length)} of {filteredStockMovements.length} results
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setMovementCurrentPage(movementCurrentPage - 1)}
                      disabled={movementCurrentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <div className="flex space-x-1">
                      {Array.from({ length: movementTotalPages }, (_, i) => i + 1).map((page) => {
                        const showPage = 
                          page === 1 || 
                          page === movementTotalPages || 
                          (page >= movementCurrentPage - 1 && page <= movementCurrentPage + 1);
                        
                        if (!showPage) {
                          if (page === movementCurrentPage - 2 || page === movementCurrentPage + 2) {
                            return (
                              <span key={page} className="px-3 py-2 text-sm text-gray-500">
                                ...
                              </span>
                            );
                          }
                          return null;
                        }

                        return (
                          <button
                            key={page}
                            onClick={() => setMovementCurrentPage(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              movementCurrentPage === page
                                ? "bg-blue-600 text-white"
                                : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setMovementCurrentPage(movementCurrentPage + 1)}
                      disabled={movementCurrentPage === movementTotalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Stock Movement Form */}
      {showForm && (
        <StockMovementForm
          locations={locations}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function StockMovementForm({ locations, onClose }: any) {
  const [formData, setFormData] = useState({
    productId: "",
    locationId: "",
    type: "inbound" as "inbound" | "outbound" | "adjustment" | "transfer_out" | "transfer_in",
    quantity: 0,
    reference: "",
    notes: "",
    transferToLocationId: "",
  });

  const products = useQuery(api.products.list);
  const updateStock = useMutation(api.stock.updateStock);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.locationId || formData.quantity <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      await updateStock({
        productId: formData.productId as any,
        locationId: formData.locationId as any,
        type: formData.type,
        quantity: formData.quantity,
        reference: formData.reference || undefined,
        notes: formData.notes || undefined,
        transferToLocationId: formData.transferToLocationId ? formData.transferToLocationId as any : undefined,
      });
      toast.success("Stock movement recorded successfully!");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to record stock movement");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 lg:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Stock Movement</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product *
              </label>
              <select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              >
                <option value="">Select Product</option>
                {products?.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <select
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              >
                <option value="">Select Location</option>
                {locations.map((location: any) => (
                  <option key={location._id} value={location._id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Movement Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              >
                <option value="inbound">Inbound (Receiving)</option>
                <option value="outbound">Outbound (Dispatching)</option>
                <option value="adjustment">Adjustment</option>
                <option value="transfer_out">Transfer Out</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              />
            </div>

            {formData.type === "transfer_out" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transfer To Location *
                </label>
                <select
                  value={formData.transferToLocationId}
                  onChange={(e) => setFormData({ ...formData, transferToLocationId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                >
                  <option value="">Select Destination</option>
                  {locations
                    .filter((loc: any) => loc._id !== formData.locationId)
                    .map((location: any) => (
                      <option key={location._id} value={location._id}>
                        {location.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="PO#, Invoice#, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                rows={3}
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {isLoading ? "Recording..." : "Record Movement"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
