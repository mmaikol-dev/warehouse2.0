import React, { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import JsBarcode from "jsbarcode";
import jsPDF from "jspdf";

export function BarcodesTab() {
  const [activeView, setActiveView] = useState<"scans" | "sessions" | "generator">("scans");
  const [sessionFilter, setSessionFilter] = useState<"all" | "active" | "completed" | "cancelled">("all");

  const barcodeScans = useQuery(api.barcodes.getAllBarcodeScans, { limit: 100 });
  const scanSessions = useQuery(api.barcodes.getScanSessions, { 
    limit: 50,
    status: sessionFilter === "all" ? undefined : sessionFilter as any
  });
  const barcodeStats = useQuery(api.barcodes.getBarcodeStats);

  if (barcodeScans === undefined || scanSessions === undefined || barcodeStats === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Barcode Management</h1>
        <p className="text-gray-600">Generate, view, and manage barcode scans and sessions</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white p-4 lg:p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Scans</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{barcodeStats.totalScans}</p>
            </div>
            <div className="text-2xl">📱</div>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{barcodeStats.totalSessions}</p>
            </div>
            <div className="text-2xl">📋</div>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-xl lg:text-2xl font-bold text-green-600">{barcodeStats.activeSessions}</p>
            </div>
            <div className="text-2xl">🟢</div>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Sessions</p>
              <p className="text-xl lg:text-2xl font-bold text-blue-600">{barcodeStats.completedSessions}</p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="bg-white p-4 lg:p-6 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveView("generator")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === "generator"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Generate Barcodes
            </button>
            <button
              onClick={() => setActiveView("scans")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === "scans"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Individual Scans
            </button>
            <button
              onClick={() => setActiveView("sessions")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === "sessions"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Scan Sessions
            </button>
          </div>

          {activeView === "sessions" && (
            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Sessions</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      {activeView === "generator" ? (
        <BarcodeGeneratorView />
      ) : activeView === "scans" ? (
        <IndividualScansView scans={barcodeScans} />
      ) : (
        <ScanSessionsView sessions={scanSessions} />
      )}
    </div>
  );
}

function BarcodeGeneratorView() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    productId: "",
    locationId: "",
    quantity: 1,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const products = useQuery(api.products.list);
  const locations = useQuery(api.locations.list);
  const generateBarcodes = useMutation(api.barcodeGenerator.generateBarcodes);

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const selectedProduct = products?.find(p => p._id === formData.productId);
  const selectedLocation = locations?.find(l => l._id === formData.locationId);

  const handleGenerate = async () => {
    if (!formData.productId || !formData.locationId || formData.quantity <= 0) {
      toast.error("Please complete all steps");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateBarcodes({
        productId: formData.productId as any,
        locationId: formData.locationId as any,
        quantity: formData.quantity,
      });
      setGeneratedData(result);
      setStep(4);
      toast.success(`Generated ${result.quantity} barcodes successfully!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to generate barcodes");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadLabels = async () => {
    if (!generatedData) return;
    
    toast.info("Generating barcode labels...");
    
    try {
      // Create PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // PDF dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const labelWidth = 60;
      const labelHeight = 30;
      const labelsPerRow = Math.floor((pageWidth - 2 * margin) / labelWidth);
      const labelsPerColumn = Math.floor((pageHeight - 2 * margin) / labelHeight);
      const labelsPerPage = labelsPerRow * labelsPerColumn;
      
      // Add title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Barcode Labels', pageWidth / 2, 15, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Product: ${generatedData.product.name} | Location: ${generatedData.location.name} | Quantity: ${generatedData.quantity}`, pageWidth / 2, 22, { align: 'center' });
      
      let currentPage = 0;
      let labelIndex = 0;
      
      for (let i = 0; i < generatedData.barcodes.length; i++) {
        const barcode = generatedData.barcodes[i];
        
        // Check if we need a new page
        if (labelIndex >= labelsPerPage) {
          pdf.addPage();
          currentPage++;
          labelIndex = 0;
        }
        
        // Calculate position
        const row = Math.floor(labelIndex / labelsPerRow);
        const col = labelIndex % labelsPerRow;
        const x = margin + col * labelWidth;
        const y = margin + 30 + row * labelHeight;
        
        // Generate barcode canvas
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 120;
        
        JsBarcode(canvas, barcode, {
          format: "CODE128",
          width: 2,
          height: 80,
          displayValue: true,
          fontSize: 12,
          margin: 10,
          background: "#ffffff",
          lineColor: "#000000"
        });
        
        // Convert canvas to image data
        const imgData = canvas.toDataURL('image/png');
        
        // Add barcode to PDF
        pdf.addImage(imgData, 'PNG', x + 2, y + 2, labelWidth - 4, 16);
        
        // Add product name
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        const productName = generatedData.product.name.length > 20 
          ? generatedData.product.name.substring(0, 20) + '...' 
          : generatedData.product.name;
        pdf.text(productName, x + labelWidth / 2, y + 20, { align: 'center' });
        
        // Add SKU
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`SKU: ${generatedData.product.sku}`, x + labelWidth / 2, y + 24, { align: 'center' });
        
        // Add border
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(x, y, labelWidth, labelHeight);
        
        labelIndex++;
      }
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `barcode-labels-${generatedData.product.sku}-${timestamp}.pdf`;
      
      // Download the PDF
      pdf.save(filename);
      
      toast.success(`Downloaded ${generatedData.quantity} barcode labels as PDF!`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({ productId: "", locationId: "", quantity: 1 });
    setSearchTerm("");
    setGeneratedData(null);
  };

  if (products === undefined || locations === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Generate Barcodes</h2>
          {step > 1 && (
            <button
              onClick={resetForm}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Start Over
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-4 mb-8">
          {[1, 2, 3, 4].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= stepNum 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-200 text-gray-600"
              }`}>
                {stepNum}
              </div>
              {stepNum < 4 && (
                <div className={`w-12 h-0.5 ${
                  step > stepNum ? "bg-blue-600" : "bg-gray-200"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Product Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 1: Select Product</h3>
              <p className="text-gray-600 mb-4">Choose the product for which you want to generate barcodes</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Products
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Search by product name or SKU..."
              />
            </div>

            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? "No products found matching your search" : "No products available"}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <button
                      key={product._id}
                      onClick={() => {
                        setFormData({ ...formData, productId: product._id });
                        setStep(2);
                      }}
                      className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                      <div className="text-sm text-gray-500">Price: ${product.unitPrice}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Location Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 2: Select Location</h3>
              <p className="text-gray-600 mb-4">Choose where the barcoded items will be stored</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="font-medium text-blue-900">Selected Product:</div>
              <div className="text-blue-800">{selectedProduct?.name} ({selectedProduct?.sku})</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {locations.map((location) => (
                <button
                  key={location._id}
                  onClick={() => {
                    setFormData({ ...formData, locationId: location._id });
                    setStep(3);
                  }}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="font-medium text-gray-900">{location.name}</div>
                  {location.address && (
                    <div className="text-sm text-gray-500 mt-1">{location.address}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Quantity */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 3: Set Quantity</h3>
              <p className="text-gray-600 mb-4">How many barcodes do you want to generate?</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-2">
              <div><span className="font-medium text-blue-900">Product:</span> <span className="text-blue-800">{selectedProduct?.name}</span></div>
              <div><span className="font-medium text-blue-900">Location:</span> <span className="text-blue-800">{selectedLocation?.name}</span></div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity (1-1000)
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">This will add {formData.quantity} units to your inventory</p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || formData.quantity <= 0 || formData.quantity > 1000}
              className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isGenerating ? "Generating..." : `Generate ${formData.quantity} Barcodes`}
            </button>
          </div>
        )}

        {/* Step 4: Results */}
        {step === 4 && generatedData && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Barcodes Generated Successfully!</h3>
              <p className="text-gray-600">Your barcodes have been generated and added to inventory</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-2">
              <div><span className="font-medium text-green-900">Product:</span> <span className="text-green-800">{generatedData.product.name}</span></div>
              <div><span className="font-medium text-green-900">Location:</span> <span className="text-green-800">{generatedData.location.name}</span></div>
              <div><span className="font-medium text-green-900">Quantity:</span> <span className="text-green-800">{generatedData.quantity} barcodes</span></div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDownloadLabels}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                📄 Download PDF Labels
              </button>
              <button
                onClick={resetForm}
                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Generate More
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Generated Barcodes Preview</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                {generatedData.barcodes.slice(0, 6).map((barcode: string, index: number) => (
                  <div key={index} className="text-center p-2 bg-gray-50 rounded">
                    <BarcodePreview barcode={barcode} />
                    <div className="text-xs text-gray-600 mt-1">{barcode}</div>
                  </div>
                ))}
                {generatedData.barcodes.length > 6 && (
                  <div className="flex items-center justify-center p-2 bg-gray-100 rounded text-gray-600">
                    +{generatedData.barcodes.length - 6} more
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BarcodePreview({ barcode }: { barcode: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (canvasRef.current) {
      JsBarcode(canvasRef.current, barcode, {
        format: "CODE128",
        width: 1,
        height: 30,
        displayValue: false,
        margin: 5,
      });
    }
  }, [barcode]);

  return <canvas ref={canvasRef} className="max-w-full" />;
}

function IndividualScansView({ scans }: { scans: any[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate pagination
  const totalPages = Math.ceil(scans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentScans = scans.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Individual Barcode Scans</h2>
      </div>
      
      {scans.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">📱</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No barcode scans yet</h3>
          <p className="text-gray-500">Barcode scans will appear here once you start scanning</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Barcode
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scanned By
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scanned At
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentScans.map((scan) => (
                  <tr key={scan._id}>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                        {scan.barcode}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {scan.session.product?.name || "Unknown Product"}
                      </div>
                      <div className="text-sm text-gray-500">
                        SKU: {scan.session.product?.sku}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {scan.session.location?.name}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {scan.session.user?.name || scan.session.user?.email}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(scan.scannedAt).toLocaleString()}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        scan.session.status === "active" ? "bg-green-100 text-green-800" :
                        scan.session.status === "completed" ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {scan.session.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-4 lg:px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, scans.length)} of {scans.length} results
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage = 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1);
                      
                      if (!showPage) {
                        // Show ellipsis for gaps
                        if (page === currentPage - 2 || page === currentPage + 2) {
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
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            currentPage === page
                              ? "bg-blue-600 text-white"
                              : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
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
  );
}

function ScanSessionsView({ sessions }: { sessions: any[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate pagination
  const totalPages = Math.ceil(sessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSessions = sessions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Scan Sessions</h2>
      </div>
      
      {sessions.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No scan sessions yet</h3>
          <p className="text-gray-500">Scan sessions will appear here once you start scanning or generating barcodes</p>
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
                    Scans Count
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentSessions.map((session) => (
                  <tr key={session._id}>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {session.product?.name || "Unknown Product"}
                      </div>
                      <div className="text-sm text-gray-500">
                        SKU: {session.product?.sku}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.location?.name}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {session.actualScanCount} / {session.totalScanned}
                      </div>
                      <div className="text-xs text-gray-500">
                        actual / recorded
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        session.status === "active" ? "bg-green-100 text-green-800" :
                        session.status === "completed" ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.user?.name || session.user?.email}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(session.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.completedAt ? new Date(session.completedAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-4 lg:px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, sessions.length)} of {sessions.length} results
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage = 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1);
                      
                      if (!showPage) {
                        // Show ellipsis for gaps
                        if (page === currentPage - 2 || page === currentPage + 2) {
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
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            currentPage === page
                              ? "bg-blue-600 text-white"
                              : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
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
  );
}
