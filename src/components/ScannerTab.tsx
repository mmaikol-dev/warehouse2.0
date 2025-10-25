import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function ScannerTab() {
  const [scanMode, setScanMode] = useState<"single" | "bulk">("single");
  const [barcode, setBarcode] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");

  const locations = useQuery(api.locations.list);
  const products = useQuery(api.products.list);
  const activeSession = useQuery(api.scanner.getActiveScanSession);
  
  const singleScan = useMutation(api.scanner.singleScan);
  const startBulkSession = useMutation(api.scanner.startBulkScanSession);
  const addBarcodeToSession = useMutation(api.scanner.addBarcodeToSession);
  const completeBulkSession = useMutation(api.scanner.completeBulkScanSession);
  const cancelBulkSession = useMutation(api.scanner.cancelBulkScanSession);

  const handleSingleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode || !selectedLocation) {
      toast.error("Please enter barcode and select location");
      return;
    }

    try {
      const result = await singleScan({
        barcode,
        locationId: selectedLocation as any,
      });
      toast.success(result.message);
      setBarcode("");
    } catch (error: any) {
      toast.error(error.message || "Failed to process scan");
    }
  };

  const handleStartBulkSession = async () => {
    if (!selectedProduct || !selectedLocation) {
      toast.error("Please select product and location");
      return;
    }

    try {
      await startBulkSession({
        productId: selectedProduct as any,
        locationId: selectedLocation as any,
      });
      toast.success("Bulk scan session started");
    } catch (error: any) {
      toast.error(error.message || "Failed to start session");
    }
  };

  const handleBulkScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode || !activeSession) return;

    try {
      const count = await addBarcodeToSession({
        sessionId: activeSession._id,
        barcode,
      });
      toast.success(`Scanned ${count} items`);
      setBarcode("");
    } catch (error: any) {
      toast.error(error.message || "Failed to add scan");
    }
  };

  const handleCompleteBulkSession = async () => {
    if (!activeSession) return;

    try {
      const result = await completeBulkSession({
        sessionId: activeSession._id,
      });
      toast.success(`Session completed! Added ${result.totalScanned} items of ${result.product?.name}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to complete session");
    }
  };

  const handleCancelBulkSession = async () => {
    if (!activeSession) return;

    try {
      await cancelBulkSession({
        sessionId: activeSession._id,
      });
      toast.success("Session cancelled");
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel session");
    }
  };

  if (locations === undefined || products === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Barcode Scanner</h1>
        <p className="text-gray-600">Scan barcodes to manage inventory</p>
      </div>

      {/* Mode Selection */}
      <div className="bg-white p-4 lg:p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Scan Mode</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setScanMode("single")}
            className={`flex-1 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
              scanMode === "single"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Single Scan
          </button>
          <button
            onClick={() => setScanMode("bulk")}
            className={`flex-1 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
              scanMode === "bulk"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Bulk Scan
          </button>
        </div>
      </div>

      {/* Location Selection */}
      <div className="bg-white p-4 lg:p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value="">Select Location</option>
          {locations.map((location) => (
            <option key={location._id} value={location._id}>
              {location.name}
            </option>
          ))}
        </select>
      </div>

      {/* Single Scan Mode */}
      {scanMode === "single" && (
        <div className="bg-white p-4 lg:p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Single Scan</h2>
          <p className="text-gray-600 mb-4 text-sm">
            Scan a barcode to add 1 unit to inventory. If the product doesn't exist, it will be created automatically.
          </p>
          <form onSubmit={handleSingleScan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Barcode
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Scan or enter barcode"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!barcode || !selectedLocation}
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Process Scan
            </button>
          </form>
        </div>
      )}

      {/* Bulk Scan Mode */}
      {scanMode === "bulk" && (
        <div className="space-y-6">
          {!activeSession ? (
            <div className="bg-white p-4 lg:p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Start Bulk Scan Session</h2>
              <p className="text-gray-600 mb-4 text-sm">
                Select a product to start scanning multiple units of the same item.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product
                  </label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleStartBulkSession}
                  disabled={!selectedProduct || !selectedLocation}
                  className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Start Session
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Session Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 lg:p-6">
                <h2 className="text-lg font-semibold text-green-800 mb-2">Active Bulk Scan Session</h2>
                <div className="space-y-2 text-green-700 text-sm">
                  <p><strong>Product:</strong> {activeSession.product?.name}</p>
                  <p><strong>Location:</strong> {activeSession.location?.name}</p>
                  <p><strong>Items Scanned:</strong> {activeSession.totalScanned}</p>
                </div>
              </div>

              {/* Scan Input */}
              <div className="bg-white p-4 lg:p-6 rounded-lg border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Scan Barcodes</h2>
                <form onSubmit={handleBulkScan} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Barcode
                    </label>
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Scan barcode"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!barcode}
                    className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Add Scan
                  </button>
                </form>
              </div>

              {/* Session Actions */}
              <div className="bg-white p-4 lg:p-6 rounded-lg border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Session Actions</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleCompleteBulkSession}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Complete Session
                  </button>
                  <button
                    onClick={handleCancelBulkSession}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Cancel Session
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
