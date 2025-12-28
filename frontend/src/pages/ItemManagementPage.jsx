import React, { useState, useEffect, useMemo } from "react";
import useItemStore from "../store/ItemStore";
import useCategoryStore from "../store/CategoryStore";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

const ItemManagementPage = () => {
  const {
    currentItem,
    searchResults,
    loading,
    error,
    successMessage,
    addItem,
    updateItem,
    updateStockLevel,
    searchItems,
    getItemQuantity,
    deleteItem,
    clearMessages,
    setCurrentItem,
    clearCurrentItem,
    clearSearchResults,
  } = useItemStore();

  const { categories, loadCategories } = useCategoryStore();

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("1");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' or 'edit'
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [currentStock, setCurrentStock] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    itemName: "",
    itemDescription: "",
    itemUnitPrice: "",
    itemCostPrice: "",
    itemCategory: "",
    itemImage: "",
    barcode: "",
    inventoryID: "",
    locationID: "1",
    quantity: "",
    suplierID: "1",
  });

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Handle Notifications
  useEffect(() => {
    if (successMessage) {
      setToast({ message: successMessage, type: "success" });
      clearMessages();
    }
    if (error) {
      setToast({ message: error, type: "error" });
      clearMessages();
    }
  }, [successMessage, error, clearMessages]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    await searchItems(searchTerm, parseInt(selectedLocationId));
  };

  const fetchCurrentStock = async (barcode, locationId) => {
    if (!barcode || !locationId) return;
    setStockLoading(true);
    try {
      const result = await getItemQuantity(barcode, locationId);
      if (result.success && result.data) {
        setCurrentStock(result.data);
      } else {
        setCurrentStock(null);
      }
    } catch (err) {
      setCurrentStock(null);
    } finally {
      setStockLoading(false);
    }
  };

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    if (mode === "edit" && item) {
      setCurrentItem(item);
      setFormData({
        itemName: item.itemName || "",
        itemDescription: item.itemDescription || "",
        itemUnitPrice: item.itemUnitPrice || item.UnitPrice || "",
        itemCostPrice: item.itemCostPrice || item.CostPrice || "",
        itemCategory: item.itemCategory || item.CategoryID || "",
        itemImage: item.itemImage || "",
        barcode: item.barcode || "",
        inventoryID: item.inventoryID || item.InventoryID || "",
        locationID: item.locationID || item.LocationID || "1",
        quantity: "",
        suplierID: Array.isArray(item.suplierID)
          ? item.suplierID[0]
          : item.suplierID || "1",
      });
      fetchCurrentStock(item.barcode, selectedLocationId);
    } else {
      clearCurrentItem();
      setFormData({
        itemName: "",
        itemDescription: "",
        itemUnitPrice: "",
        itemCostPrice: "",
        itemCategory: "",
        itemImage: "",
        barcode: "",
        inventoryID: "",
        locationID: selectedLocationId,
        quantity: "",
        suplierID: "1",
      });
      setCurrentStock(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    clearCurrentItem();
    setCurrentStock(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const apiData = {
      ...formData,
      itemUnitPrice: parseFloat(formData.itemUnitPrice) || 0,
      itemCostPrice: parseFloat(formData.itemCostPrice) || 0,
      itemCategory: parseInt(formData.itemCategory) || 1,
      inventoryID: parseInt(formData.inventoryID) || 0,
      locationID: parseInt(formData.locationID) || 1,
      quantity: parseInt(formData.quantity) || 0,
      suplierID: parseInt(formData.suplierID) || 1,
    };

    if (modalMode === "add") {
      const result = await addItem(apiData);
      if (result.success) {
        handleCloseModal();
        handleSearch();
      }
    } else {
      const updateData = {
        itemName: formData.itemName,
        itemDescription: formData.itemDescription,
        itemUnitPrice: parseFloat(formData.itemUnitPrice) || 0,
        itemCostPrice: parseFloat(formData.itemCostPrice) || 0,
        itemCategory: parseInt(formData.itemCategory) || 1,
        itemImage: formData.itemImage,
        barcode: formData.barcode,
        suplierID: parseInt(formData.suplierID) || 1,
        updatedUser: 1,
      };
      const result = await updateItem(formData.inventoryID, updateData);
      if (result.success) {
        handleCloseModal();
        handleSearch();
      }
    }
  };

  const handleStockUpdate = async () => {
    if (!currentItem || !formData.quantity) return;
    const result = await updateStockLevel(
      currentItem.inventoryID || currentItem.InventoryID,
      parseInt(selectedLocationId),
      parseInt(formData.quantity)
    );
    if (result.success) {
      setFormData((prev) => ({ ...prev, quantity: "" }));
      fetchCurrentStock(currentItem.barcode, selectedLocationId);
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      const result = await deleteItem(
        itemToDelete.inventoryID || itemToDelete.InventoryID
      );
      if (result.success) {
        handleSearch();
      }
      setItemToDelete(null);
      setShowConfirmDelete(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Item Management
            </h1>
            <p className="text-gray-500 mt-2 font-medium">
              Manage your inventory items and stock levels
            </p>
          </div>
          <button
            onClick={() => handleOpenModal("add")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-200 flex items-center gap-2"
          >
            <span>+</span> Add New Item
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-32">
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
              Location ID
            </label>
            <input
              type="number"
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all font-bold"
              placeholder="Loc ID"
              min="1"
            />
          </div>
          <div className="relative flex-1">
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
              Search By Barcode or Name
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
              <input
                type="text"
                placeholder="Type barcode or item name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all"
              />
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchTerm.trim()}
            className="px-8 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>
              {loading ? (
                <span className="w-5 h-5 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin"></span>
              ) : (
                "🔍"
              )}
            </span>
            <span>Search</span>
          </button>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Item Details
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && searchResults.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    <div className="flex justify-center items-center gap-3">
                      <span className="w-6 h-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
                      Searching for items...
                    </div>
                  </td>
                </tr>
              ) : searchResults.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-16 text-center text-gray-400 italic"
                  >
                    {searchTerm
                      ? "No items found for your search."
                      : "Enter a search term to find items."}
                  </td>
                </tr>
              ) : (
                searchResults.map((item) => (
                  <tr
                    key={item.inventoryID || item.InventoryID}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                          📦
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 uppercase">
                            {item.itemName}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            ID:{" "}
                            <span className="text-emerald-600 font-bold">
                              #{item.inventoryID || item.InventoryID}
                            </span>{" "}
                            | {item.barcode}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">
                        Rs.{" "}
                        {parseFloat(
                          item.itemUnitPrice || item.UnitPrice || 0
                        ).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400 italic">
                        Cost: Rs.{" "}
                        {parseFloat(
                          item.itemCostPrice || item.CostPrice || 0
                        ).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-600">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold">
                        Cat: {item.itemCategory || item.CategoryID || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal("edit", item)}
                          className="px-3 py-1.5 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-all shadow-sm font-bold uppercase tracking-wider"
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item)}
                          className="px-3 py-1.5 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-all shadow-sm font-bold uppercase tracking-wider"
                          title="Delete"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Item Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={handleCloseModal}
            ></div>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden animate-zoom-in max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-extrabold text-gray-900 uppercase">
                  {modalMode === "add" ? "Add New Item" : "Edit Item"}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information Section */}
                  <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">
                          Item Name
                        </label>
                        <input
                          type="text"
                          name="itemName"
                          value={formData.itemName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold uppercase transition-all"
                          placeholder="EX: PENDRIVE"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">
                          Barcode
                        </label>
                        <input
                          type="text"
                          name="barcode"
                          value={formData.barcode}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold transition-all"
                          placeholder="EX: 12345678"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">
                        Description
                      </label>
                      <textarea
                        name="itemDescription"
                        value={formData.itemDescription}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium uppercase transition-all"
                        placeholder="ITEM DESCRIPTION"
                      />
                    </div>
                  </div>

                  {/* Pricing and Category Section */}
                  <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Pricing & Category
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">
                          Unit Price
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                            Rs.
                          </span>
                          <input
                            type="number"
                            name="itemUnitPrice"
                            value={formData.itemUnitPrice}
                            onChange={handleInputChange}
                            step="0.01"
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold transition-all"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">
                          Cost Price
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                            Rs.
                          </span>
                          <input
                            type="number"
                            name="itemCostPrice"
                            value={formData.itemCostPrice}
                            onChange={handleInputChange}
                            step="0.01"
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold transition-all"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">
                          Category
                        </label>
                        <select
                          name="itemCategory"
                          value={formData.itemCategory}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold transition-all"
                          required
                        >
                          <option value="">Select Category</option>
                          {categories.map((cat) => (
                            <option key={cat.CategoryID} value={cat.CategoryID}>
                              {cat.CategoryName.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Stock Management Section (Only in Edit or Initial State in Add) */}
                  <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-4">
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                      Stock Information
                    </h3>

                    {modalMode === "add" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-blue-500 uppercase ml-1">
                            Initial Quantity
                          </label>
                          <input
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold transition-all bg-white"
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-blue-500 uppercase ml-1">
                            Location ID
                          </label>
                          <input
                            type="number"
                            name="locationID"
                            value={formData.locationID}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold transition-all bg-white"
                            placeholder="1"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                          <div>
                            <div className="text-[10px] font-extrabold text-blue-500 uppercase">
                              Current Stock Level
                            </div>
                            <div className="text-3xl font-black text-gray-900">
                              {stockLoading
                                ? "..."
                                : currentStock?.quantity || "0"}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              fetchCurrentStock(
                                formData.barcode,
                                selectedLocationId
                              )
                            }
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all font-bold text-xs"
                          >
                            REFRESH
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 block mb-1">
                              Set New Quantity
                            </label>
                            <input
                              type="number"
                              name="quantity"
                              value={formData.quantity}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold transition-all bg-white"
                              placeholder="Type new Qty"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={handleStockUpdate}
                              disabled={loading || !formData.quantity}
                              className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all disabled:opacity-50"
                            >
                              Update Qty
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100 italic font-medium text-xs text-gray-400">
                    * Ensure barcode is unique to avoid duplication.
                  </div>
                </form>
              </div>

              <div className="p-6 bg-gray-50 flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all uppercase tracking-wide"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-2 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-50"
                >
                  {loading && (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  )}
                  {modalMode === "add" ? "Create Item" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        <ConfirmModal
          isOpen={showConfirmDelete}
          onClose={() => setShowConfirmDelete(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Item"
          message={`Are you sure you want to delete "${itemToDelete?.itemName}"? This action will permanently remove it from the inventory.`}
          confirmText="Yes, Delete"
          type="danger"
        />

        {/* Toast Notifs */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ItemManagementPage;
