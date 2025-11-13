import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ProductsTab } from "./ProductsTab";
import { StockTab } from "./StockTab";
import { ScannerTab } from "./ScannerTab";
import { BarcodesTab } from "./BarcodesTab";
import { ReportsTab } from "./ReportsTab";
import { SettingsTab } from "./SettingsTab";
import { SignOutButton } from "../SignOutButton";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null);
  
  const dashboardStats = useQuery(api.stock.getDashboardStats);
  const lowStockProducts = useQuery(api.products.getLowStockProducts);
  const recentMovements = useQuery(api.stock.getStockMovements, { limit: 10 });
  const user = useQuery(api.auth.loggedInUser);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "products", label: "Products", icon: "📦" },
    { id: "stock", label: "Stock", icon: "📋" },
    { id: "scanner", label: "Scanner", icon: "📱" },
    { id: "barcodes", label: "Barcodes", icon: "𝄃𝄃𝄂𝄂𝄀𝄁𝄃𝄂𝄂𝄃" },
    { id: "reports", label: "Reports", icon: "📈" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  const closeSidebar = () => setSidebarOpen(false);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    closeSidebar();
  };

  const handleCardClick = (cardType: string) => {
    switch (cardType) {
      case "products":
        setActiveTab("products");
        break;
      case "lowStock":
        if (lowStockProducts && lowStockProducts.length > 0) {
          setShowModal("lowStock");
        } else {
          setActiveTab("products");
        }
        break;
      case "movements":
        if (recentMovements && recentMovements.length > 0) {
          setShowModal("movements");
        } else {
          setActiveTab("stock");
        }
        break;
      case "scanner":
        setActiveTab("scanner");
        break;
      default:
        break;
    }
    closeSidebar();
  };

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-white">
          <h1 className="text-xl font-bold text-gray-900">Inventory Pro</h1>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-lg mr-3">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* User Section - Only visible on small screens */}
        <div className="lg:hidden border-t border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          {/* Left side - Menu button and title */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {tabs.find(tab => tab.id === activeTab)?.label}
              </h1>
            </div>
          </div>

          {/* Right side - User info (desktop only) */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="hidden xl:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.email}
                </p>
              </div>
            </div>
            <SignOutButton />
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            {activeTab === "dashboard" && (
              <DashboardContent 
                stats={dashboardStats} 
                lowStockProducts={lowStockProducts} 
                recentMovements={recentMovements}
                onCardClick={handleCardClick}
              />
            )}
            {activeTab === "products" && <ProductsTab />}
            {activeTab === "stock" && <StockTab />}
            {activeTab === "scanner" && <ScannerTab />}
            {activeTab === "barcodes" && <BarcodesTab />}
            {activeTab === "reports" && <ReportsTab />}
            {activeTab === "settings" && <SettingsTab />}
          </div>
        </main>
      </div>

      {/* Modals */}
      {showModal === "lowStock" && (
        <LowStockModal 
          products={lowStockProducts || []} 
          onClose={() => setShowModal(null)}
          onViewProducts={() => {
            setShowModal(null);
            setActiveTab("products");
          }}
        />
      )}

      {showModal === "movements" && (
        <RecentMovementsModal 
          movements={recentMovements || []} 
          onClose={() => setShowModal(null)}
          onViewStock={() => {
            setShowModal(null);
            setActiveTab("stock");
          }}
        />
      )}
    </div>
  );
}

function DashboardContent({ stats, lowStockProducts, recentMovements, onCardClick }: any) {
  if (stats === undefined || lowStockProducts === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h2>
        <p className="text-gray-600">Here's an overview of your inventory system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="relative group">
          <div 
            onClick={() => onCardClick("products")}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300 hover:bg-blue-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <span className="text-2xl">📦</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to view all products →
            </div>
          </div>
          {/* Hover Popup */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg">
            <div className="font-semibold mb-1">Product Overview</div>
            <div>Total unique products in your inventory system</div>
            <div>Includes all active and inactive products</div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>

        <div className="relative group">
          <div 
            onClick={() => onCardClick("lowStock")}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-red-300 hover:bg-red-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Low Stock Items</p>
                <p className="text-2xl font-bold text-red-600">{stats.lowStockCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
              {stats.lowStockCount > 0 ? "Click to view details →" : "Click to manage products →"}
            </div>
          </div>
          {/* Hover Popup */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg">
            <div className="font-semibold mb-1">Low Stock Alert</div>
            <div>Products at or below their reorder level</div>
            <div>Requires immediate attention for restocking</div>
            <div>Check the alert section below for details</div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>

        <div className="relative group">
          <div 
            onClick={() => onCardClick("movements")}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-purple-300 hover:bg-purple-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Recent Movements</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentMovementsCount}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                <span className="text-2xl">📊</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
              {stats.recentMovementsCount > 0 ? "Click to view recent activity →" : "Click to manage stock →"}
            </div>
          </div>
          {/* Hover Popup */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg">
            <div className="font-semibold mb-1">Stock Activity (Last 30 Days)</div>
            <div>• Inbound: Receiving new stock</div>
            <div>• Outbound: Dispatching products</div>
            <div>• Adjustments: Manual corrections</div>
            <div>• Transfers: Between locations</div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>

        <div className="relative group">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Value</p>
                <p className="text-2xl font-bold text-green-600">
                  ${((stats.totalProducts || 0) * 25.99).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>
          {/* Hover Popup */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg">
            
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
            <span className="mr-2">⚠️</span>
            Low Stock Alert
          </h3>
          <div className="space-y-3">
            {lowStockProducts.slice(0, 5).map((product: any) => (
              <div key={product._id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-white rounded-lg">
                <span className="text-red-700 font-medium">{product.name}</span>
                <span className="text-red-600 text-sm">
                  {product.totalStock} units (reorder at {product.reorderLevel})
                </span>
              </div>
            ))}
            {lowStockProducts.length > 5 && (
              <p className="text-red-600 text-sm mt-3 text-center">
                +{lowStockProducts.length - 5} more items need attention
              </p>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button 
            onClick={() => onCardClick("scanner")}
            className="flex items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors group"
          >
            <span className="text-xl mr-3 group-hover:scale-110 transition-transform">📱</span>
            <span className="font-medium">Scan Barcode</span>
          </button>
          <button 
            onClick={() => onCardClick("products")}
            className="flex items-center justify-center p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors group"
          >
            <span className="text-xl mr-3 group-hover:scale-110 transition-transform">📦</span>
            <span className="font-medium">Add Product</span>
          </button>
          <button 
            onClick={() => onCardClick("movements")}
            className="flex items-center justify-center p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors group"
          >
            <span className="text-xl mr-3 group-hover:scale-110 transition-transform">📋</span>
            <span className="font-medium">Stock Movement</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function LowStockModal({ products, onClose, onViewProducts }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-red-800 flex items-center">
              <span className="mr-2">⚠️</span>
              Low Stock Alert ({products.length} items)
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-96">
          <div className="space-y-3">
            {products.map((product: any) => (
              <div key={product._id} className="flex justify-between items-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <div className="font-medium text-red-800">{product.name}</div>
                  <div className="text-sm text-red-600">SKU: {product.sku}</div>
                  <div className="text-sm text-red-600">Price: ${product.unitPrice}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-red-700">{product.totalStock} units</div>
                  <div className="text-sm text-red-600">Reorder at {product.reorderLevel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={onViewProducts}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Manage Products
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentMovementsModal({ movements, onClose, onViewStock }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="mr-2">📊</span>
              Recent Stock Movements ({movements.length} items)
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-96">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movements.map((movement: any) => (
                <tr key={movement._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(movement.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {movement.product?.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      SKU: {movement.product?.sku}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      movement.type === "inbound" ? "bg-green-100 text-green-800" :
                      movement.type === "outbound" ? "bg-red-100 text-red-800" :
                      movement.type === "adjustment" ? "bg-yellow-100 text-yellow-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {movement.type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {movement.type === "outbound" ? "-" : "+"}{movement.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {movement.location?.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={onViewStock}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              View All Stock Movements
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
