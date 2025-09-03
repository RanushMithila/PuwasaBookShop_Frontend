import React, { useState, useEffect } from 'react';
import useItemStore from '../store/ItemStore';

const ItemManagementPage = () => {
  const [formMode, setFormMode] = useState('add'); // 'add', 'edit', 'search'
  const [formData, setFormData] = useState({
    itemName: '',
    itemDescription: '',
    itemUnitPrice: '',
    itemCostPrice: '',
    itemCategory: '',
    itemImage: '',
    barcode: '',
    inventoryID: '',
    locationID: '1', // Default location
    quantity: '',
    suplierID: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('1');
  const [currentStock, setCurrentStock] = useState(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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
    clearSearchResults
  } = useItemStore();

  // Clear messages on component mount
  useEffect(() => {
    clearMessages();
  }, [clearMessages]);

  // Fetch current stock when item is selected for editing
  const fetchCurrentStock = async (barcode, locationId) => {
    if (!barcode || !locationId) return;
    
    setStockLoading(true);
    setCurrentStock(null);
    
    try {
      console.log('Fetching current stock for:', { barcode, locationId });
      const result = await getItemQuantity(barcode, locationId);
      
      if (result.success && result.data) {
        console.log('Current stock result:', result.data);
        setCurrentStock(result.data);
      } else {
        console.log('No stock data found:', result.error);
        setCurrentStock(null);
      }
    } catch (error) {
      console.error('Error fetching stock:', error);
      setCurrentStock(null);
    } finally {
      setStockLoading(false);
    }
  };

  // Update form data when current item changes
  useEffect(() => {
    console.log('Effect triggered:', { currentItem, formMode });
    if (currentItem && (formMode === 'edit' || formMode === 'search')) {
      console.log('Setting form data from current item:', currentItem);
      setFormData({
        itemName: currentItem.itemName || '',
        itemDescription: currentItem.itemDescription || '',
        itemUnitPrice: currentItem.itemUnitPrice || currentItem.UnitPrice || '',
        itemCostPrice: currentItem.itemCostPrice || currentItem.CostPrice || '',
        itemCategory: currentItem.itemCategory || currentItem.CategoryID || '',
        itemImage: currentItem.itemImage || '',
        barcode: currentItem.barcode || '',
        inventoryID: currentItem.inventoryID || currentItem.InventoryID || '',
        locationID: currentItem.locationID || currentItem.LocationID || '1',
        quantity: '', // Quantity is separate from item data
        suplierID: Array.isArray(currentItem.suplierID) ? currentItem.suplierID[0] : currentItem.suplierID || ''
      });
      
      // Fetch current stock for this item
      if (currentItem.barcode && selectedLocationId) {
        fetchCurrentStock(currentItem.barcode, selectedLocationId);
      }
    } else if (formMode === 'add') {
      console.log('Clearing form data for add mode');
      setFormData({
        itemName: '',
        itemDescription: '',
        itemUnitPrice: '',
        itemCostPrice: '',
        itemCategory: '',
        itemImage: '',
        barcode: '',
        inventoryID: '',
        locationID: '1',
        quantity: '',
        suplierID: ''
      });
      setCurrentStock(null);
    }
  }, [currentItem, formMode, selectedLocationId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input change:', { name, value, formMode });
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      console.log('New form data:', newData);
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!formData.itemName.trim() || !formData.barcode.trim()) {
      set({ error: 'Item name and barcode are required' });
      return;
    }

    // Convert string numbers to actual numbers for API
    const apiData = {
      ...formData,
      itemUnitPrice: parseFloat(formData.itemUnitPrice) || 0,
      itemCostPrice: parseFloat(formData.itemCostPrice) || 0,
      itemCategory: parseInt(formData.itemCategory) || 1,
      inventoryID: parseInt(formData.inventoryID) || 1,
      locationID: parseInt(formData.locationID) || 1,
      quantity: parseInt(formData.quantity) || 0,
      suplierID: parseInt(formData.suplierID) || 1
    };

    if (formMode === 'add') {
      const result = await addItem(apiData);
      if (result.success) {
        setFormData({
          itemName: '',
          itemDescription: '',
          itemUnitPrice: '',
          itemCostPrice: '',
          itemCategory: '',
          itemImage: '',
          barcode: '',
          inventoryID: '',
          locationID: '1',
          quantity: '',
          suplierID: ''
        });
      }
    } else if (formMode === 'edit' && currentItem) {
      // For update, we need different structure
      const updateData = {
        itemName: formData.itemName,
        itemDescription: formData.itemDescription,
        itemUnitPrice: parseFloat(formData.itemUnitPrice) || 0,
        itemCostPrice: parseFloat(formData.itemCostPrice) || 0,
        itemCategory: parseInt(formData.itemCategory) || 1,
        itemImage: formData.itemImage,
        barcode: formData.barcode,
        suplierID: parseInt(formData.suplierID) || 1,
        createdDateTime: new Date().toISOString(),
        updatedDateTime: new Date().toISOString(),
        updatedUser: 1
      };

      const result = await updateItem(currentItem.inventoryID || currentItem.InventoryID, updateData);
      if (result.success) {
        setFormMode('search');
      }
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    clearMessages();
    setHasSearched(true);
    console.log('Searching for:', searchTerm, 'in location:', selectedLocationId);
    
    const result = await searchItems(searchTerm, parseInt(selectedLocationId));
    if (result.success && result.data.length > 0) {
      setFormMode('edit');
      setCurrentItem(result.data[0]); // Set first result as current
    } else {
      // Handle both failure cases and successful searches with no results
      console.log('Search completed but no items found or error occurred:', result);
      // The error state is already set by the store, so we don't need to manually set it here
      // Just ensure we're not in edit mode if no results
      if (result.success && result.data.length === 0) {
        // This was a successful search but with no results
        console.log('Successful search with no results');
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
      setFormData(prev => ({ ...prev, quantity: '' }));
      // Refresh current stock after successful update
      if (currentItem.barcode && selectedLocationId) {
        fetchCurrentStock(currentItem.barcode, selectedLocationId);
      }
    }
  };

  const handleDelete = async () => {
    if (!currentItem) return;
    
    if (window.confirm(`Are you sure you want to delete item "${currentItem.itemName}"?`)) {
      const result = await deleteItem(currentItem.inventoryID || currentItem.InventoryID);
      if (result.success) {
        clearCurrentItem();
        clearSearchResults();
        setFormMode('add');
        setSearchTerm('');
      }
    }
  };

  const handleNewItem = () => {
    clearCurrentItem();
    clearSearchResults();
    setFormData({
      itemName: '',
      itemDescription: '',
      itemUnitPrice: '',
      itemCostPrice: '',
      itemCategory: '',
      itemImage: '',
      barcode: '',
      inventoryID: '',
      locationID: '1',
      quantity: '',
      suplierID: ''
    });
    setFormMode('add');
    setSearchTerm('');
    setCurrentStock(null);
    setHasSearched(false);
    clearMessages();
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Item Management</h1>

        {/* Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Search */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Search Items</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Location ID</label>
                <input
                  type="number"
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Location ID"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Search (Barcode/Name)</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setHasSearched(false); // Reset search state when term changes
                    }}
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter barcode or item name"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading || !searchTerm.trim()}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400"
                  >
                    {loading ? 'Loading...' : 'Search'}
                  </button>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Search Results ({searchResults.length})</h3>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {searchResults.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setCurrentItem(item);
                          setFormMode('edit');
                        }}
                        className="p-2 border rounded cursor-pointer hover:bg-gray-50"
                      >
                        <div className="text-sm font-medium">{item.itemName}</div>
                        <div className="text-xs text-gray-500">
                          {item.barcode} | Rs: {item.itemUnitPrice || item.UnitPrice}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Items Found Message */}
              {!loading && hasSearched && searchTerm.trim() && searchResults.length === 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center">
                    <div className="text-yellow-600 mr-2">🔍</div>
                    <div>
                      <p className="text-sm text-yellow-800">
                        No items found for "{searchTerm}"
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Try a different barcode, item name, or check the location ID. You can also add a new item.
                      </p>
                      {error && (
                        <p className="text-xs text-red-600 mt-1 font-medium">
                          {error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Middle Column - Item Form */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {formMode === 'add' ? 'Add Item' : 
                 formMode === 'edit' ? 'Edit Item' : 'Item Details'}
              </h2>
              <button
                onClick={handleNewItem}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                New Item
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Item Name *</label>
                  <input
                    type="text"
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter item name"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Barcode *</label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter barcode"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="itemDescription"
                  value={formData.itemDescription}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter item description"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Unit Price</label>
                  <input
                    type="number"
                    name="itemUnitPrice"
                    value={formData.itemUnitPrice}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Cost Price</label>
                  <input
                    type="number"
                    name="itemCostPrice"
                    value={formData.itemCostPrice}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category ID</label>
                  <input
                    type="number"
                    name="itemCategory"
                    value={formData.itemCategory}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Location ID</label>
                  <input
                    type="number"
                    name="locationID"
                    value={formData.locationID}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Supplier ID</label>
                  <input
                    type="number"
                    name="suplierID"
                    value={formData.suplierID}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1"
                    disabled={loading}
                  />
                </div>
              </div>

              {formMode === 'add' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Initial Quantity</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Inventory ID</label>
                    <input
                      type="number"
                      name="inventoryID"
                      value={formData.inventoryID}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Auto-generated"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <input
                  type="text"
                  name="itemImage"
                  value={formData.itemImage}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter image URL"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 
                 formMode === 'add' ? 'Add Item' : 'Update Item'}
              </button>
            </form>

            {/* Current Stock Display Section */}
            {currentItem && formMode === 'edit' && (
              <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
                <h3 className="font-medium mb-3 text-blue-800">📦 Current Stock Information</h3>
                
                {stockLoading ? (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    <span>Loading current stock...</span>
                  </div>
                ) : currentStock ? (
                  <div className="space-y-2">
                    {Array.isArray(currentStock) ? (
                      currentStock.map((stock, index) => (
                        <div key={index} className="flex justify-between items-center bg-white p-3 rounded border">
                          <div>
                            <div className="font-medium text-gray-900">Inventory ID: {stock.inventoryID}</div>
                            <div className="text-sm text-gray-600">
                              Barcode: {currentItem.barcode} | Location: {selectedLocationId}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              {stock.quantity || 0}
                            </div>
                            <div className="text-xs text-gray-500">units in stock</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-between items-center bg-white p-3 rounded border">
                        <div>
                          <div className="font-medium text-gray-900">Inventory ID: {currentStock.inventoryID}</div>
                          <div className="text-sm text-gray-600">
                            Barcode: {currentItem.barcode} | Location: {selectedLocationId}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {currentStock.quantity || 0}
                          </div>
                          <div className="text-xs text-gray-500">units in stock</div>
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => fetchCurrentStock(currentItem.barcode, selectedLocationId)}
                      disabled={stockLoading}
                      className="w-full mt-2 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:bg-gray-400"
                    >
                      🔄 Refresh Stock
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-gray-500 mb-2">No stock information available</div>
                    <button
                      onClick={() => fetchCurrentStock(currentItem.barcode, selectedLocationId)}
                      disabled={stockLoading || !currentItem.barcode}
                      className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:bg-gray-400"
                    >
                      📊 Check Stock
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Stock Update Section */}
            {currentItem && formMode === 'edit' && (
              <div className="mt-6 p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium mb-2">Stock Management</h3>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="New quantity"
                  />
                  <button
                    onClick={handleStockUpdate}
                    disabled={loading || !formData.quantity}
                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:bg-gray-400"
                  >
                    Update Stock
                  </button>
                </div>
              </div>
            )}

            {/* Action buttons when item is loaded */}
            {currentItem && (
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 disabled:bg-gray-400"
                >
                  {loading ? 'Deleting...' : '🗑️ Delete'}
                </button>
                <button
                  onClick={handleNewItem}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                >
                  Clear & New
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Debug Section */}
        <div className="mt-8 bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium mb-2">Debug Information</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>Mode: {formMode}</p>
            <p>Loading: {loading ? 'Yes' : 'No'}</p>
            <p>Stock Loading: {stockLoading ? 'Yes' : 'No'}</p>
            <p>Current Item: {currentItem ? `${currentItem.itemName} (ID: ${currentItem.inventoryID || currentItem.InventoryID})` : 'None'}</p>
            <p>Search Results: {searchResults.length} items</p>
            <p>Selected Location: {selectedLocationId}</p>
            <p>Current Stock: {currentStock ? (Array.isArray(currentStock) ? `${currentStock.length} entries, total: ${currentStock.reduce((sum, item) => sum + (item.quantity || 0), 0)} units` : `${currentStock.quantity || 0} units`) : 'None'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemManagementPage;
