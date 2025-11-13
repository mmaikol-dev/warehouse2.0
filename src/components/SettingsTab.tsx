import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function SettingsTab() {
  const [activeSection, setActiveSection] = useState<"locations" | "categories" | "suppliers" | "users">("locations");

  const sections = [
    { id: "locations", label: "Locations", icon: "📍" },
    { id: "categories", label: "Categories", icon: "🏷️" },
    { id: "suppliers", label: "Suppliers", icon: "🏢" },
    { id: "users", label: "Users", icon: "👥" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage system configuration and master data</p>
      </div>

      {/* Settings Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Mobile Dropdown */}
        <div className="lg:hidden border-b border-gray-200">
          <select
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value as any)}
            className="w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white border-0 focus:ring-0"
          >
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.icon} {section.label}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden lg:flex border-b border-gray-200">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="mr-2">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </div>

        <div className="p-4 lg:p-6">
          {activeSection === "locations" && <LocationsSettings />}
          {activeSection === "categories" && <CategoriesSettings />}
          {activeSection === "suppliers" && <SuppliersSettings />}
          {activeSection === "users" && <UsersSettings />}
        </div>
      </div>
    </div>
  );
}

function LocationsSettings() {
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);

  const locations = useQuery(api.locations.list);
  const createLocation = useMutation(api.locations.create);
  const updateLocation = useMutation(api.locations.update);
  const removeLocation = useMutation(api.locations.remove);

  const handleSubmit = async (formData: any) => {
    try {
      if (editingLocation) {
        await updateLocation({ id: editingLocation._id, ...formData });
        toast.success("Location updated successfully!");
      } else {
        await createLocation(formData);
        toast.success("Location created successfully!");
      }
      setShowForm(false);
      setEditingLocation(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to save location");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this location?")) {
      try {
        await removeLocation({ id: id as any });
        toast.success("Location deleted successfully!");
      } catch (error: any) {
        toast.error(error.message || "Failed to delete location");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Locations</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Add Location
        </button>
      </div>

      <div className="space-y-2">
        {locations?.map((location) => (
          <div key={location._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg gap-3">
            <div className="flex-1">
              <div className="font-medium text-gray-900">{location.name}</div>
              {location.address && (
                <div className="text-sm text-gray-500">{location.address}</div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingLocation(location);
                  setShowForm(true);
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(location._id)}
                className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <LocationForm
          location={editingLocation}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingLocation(null);
          }}
        />
      )}
    </div>
  );
}

function CategoriesSettings() {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const categories = useQuery(api.categories.list);
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const removeCategory = useMutation(api.categories.remove);

  const handleSubmit = async (formData: any) => {
    try {
      if (editingCategory) {
        await updateCategory({ id: editingCategory._id, ...formData });
        toast.success("Category updated successfully!");
      } else {
        await createCategory(formData);
        toast.success("Category created successfully!");
      }
      setShowForm(false);
      setEditingCategory(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to save category");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        await removeCategory({ id: id as any });
        toast.success("Category deleted successfully!");
      } catch (error: any) {
        toast.error(error.message || "Failed to delete category");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Add Category
        </button>
      </div>

      <div className="space-y-2">
        {categories?.map((category) => (
          <div key={category._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg gap-3">
            <div className="flex-1">
              <div className="font-medium text-gray-900">{category.name}</div>
              {category.description && (
                <div className="text-sm text-gray-500">{category.description}</div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingCategory(category);
                  setShowForm(true);
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(category._id)}
                className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <CategoryForm
          category={editingCategory}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingCategory(null);
          }}
        />
      )}
    </div>
  );
}

function SuppliersSettings() {
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);

  const suppliers = useQuery(api.suppliers.list);
  const createSupplier = useMutation(api.suppliers.create);
  const updateSupplier = useMutation(api.suppliers.update);
  const removeSupplier = useMutation(api.suppliers.remove);

  const handleSubmit = async (formData: any) => {
    try {
      if (editingSupplier) {
        await updateSupplier({ id: editingSupplier._id, ...formData });
        toast.success("Supplier updated successfully!");
      } else {
        await createSupplier(formData);
        toast.success("Supplier created successfully!");
      }
      setShowForm(false);
      setEditingSupplier(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to save supplier");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      try {
        await removeSupplier({ id: id as any });
        toast.success("Supplier deleted successfully!");
      } catch (error: any) {
        toast.error(error.message || "Failed to delete supplier");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Suppliers</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Add Supplier
        </button>
      </div>

      <div className="space-y-2">
        {suppliers?.map((supplier) => (
          <div key={supplier._id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-4 bg-gray-50 rounded-lg gap-3">
            <div className="flex-1">
              <div className="font-medium text-gray-900">{supplier.name}</div>
              <div className="text-sm text-gray-500 space-y-1">
                {supplier.contactPerson && <div>Contact: {supplier.contactPerson}</div>}
                {supplier.email && <div>Email: {supplier.email}</div>}
                {supplier.phone && <div>Phone: {supplier.phone}</div>}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingSupplier(supplier);
                  setShowForm(true);
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(supplier._id)}
                className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <SupplierForm
          supplier={editingSupplier}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingSupplier(null);
          }}
        />
      )}
    </div>
  );
}

function UsersSettings() {
  const users = useQuery(api.users.getAllUsers);

  if (users === undefined) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Users</h2>
      <div className="space-y-2">
        {users.map((user) => (
          <div key={user._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg gap-3">
            <div className="flex-1">
              <div className="font-medium text-gray-900">{user.profile?.name}</div>
              <div className="text-sm text-gray-500">
                {user.email} • Role: {user.profile?.role}
              </div>
            </div>
            <div className="flex gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.profile?.role === "admin" ? "bg-purple-100 text-purple-800" :
                user.profile?.role === "manager" ? "bg-blue-100 text-blue-800" :
                "bg-gray-100 text-gray-800"
              }`}>
                {user.profile?.role}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Form Components
function LocationForm({ location, onSubmit, onClose }: any) {
  const [formData, setFormData] = useState({
    name: location?.name || "",
    address: location?.address || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-4 lg:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {location ? "Edit Location" : "Add Location"}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                rows={3}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                Cancel
              </button>
              <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                {location ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function CategoryForm({ category, onSubmit, onClose }: any) {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-4 lg:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {category ? "Edit Category" : "Add Category"}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                rows={3}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                Cancel
              </button>
              <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                {category ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function SupplierForm({ supplier, onSubmit, onClose }: any) {
  const [formData, setFormData] = useState({
    name: supplier?.name || "",
    contactPerson: supplier?.contactPerson || "",
    email: supplier?.email || "",
    phone: supplier?.phone || "",
    address: supplier?.address || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 lg:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {supplier ? "Edit Supplier" : "Add Supplier"}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                rows={3}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                Cancel
              </button>
              <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                {supplier ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
