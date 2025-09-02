import React, { useState, useEffect } from 'react';
import useCategoryStore from '../store/CategoryStore';

const CategoryManagementPage = () => {
  const [formMode, setFormMode] = useState('add'); // 'add', 'edit', 'view'
  const [formData, setFormData] = useState({
    CategoryName: '',
    CategoryDescription: ''
  });
  const [categoryIdInput, setCategoryIdInput] = useState('');

  const {
    currentCategory,
    loading,
    error,
    successMessage,
    addCategory,
    updateCategory,
    getCategory,
    deleteCategory,
    clearMessages,
    setCurrentCategory,
    clearCurrentCategory
  } = useCategoryStore();

  // Clear messages on component mount
  useEffect(() => {
    clearMessages();
  }, [clearMessages]);

  // Update form data when current category changes OR when switching to edit mode
  useEffect(() => {
    console.log('Effect triggered:', { currentCategory, formMode });
    if (currentCategory) {
      if (formMode === 'edit') {
        console.log('Setting form data from current category for edit mode:', currentCategory);
        setFormData({
          CategoryName: currentCategory.CategoryName || '',
          CategoryDescription: currentCategory.CategoryDescription || ''
        });
      } else if (formMode === 'view') {
        // Even in view mode, populate the form data for immediate editing capability
        console.log('Setting form data from current category for view mode:', currentCategory);
        setFormData({
          CategoryName: currentCategory.CategoryName || '',
          CategoryDescription: currentCategory.CategoryDescription || ''
        });
      }
    } else if (formMode === 'add') {
      console.log('Clearing form data for add mode');
      setFormData({
        CategoryName: '',
        CategoryDescription: ''
      });
    }
  }, [currentCategory, formMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input change:', { name, value, formMode, currentFormData: formData }); // Debug log
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

    if (!formData.CategoryName.trim() || !formData.CategoryDescription.trim()) {
      return;
    }

    if (formMode === 'add') {
      const result = await addCategory(formData);
      if (result.success) {
        setFormData({ CategoryName: '', CategoryDescription: '' });
      }
    } else if (formMode === 'edit' && currentCategory) {
      const result = await updateCategory(currentCategory.CategoryID, formData);
      if (result.success) {
        setFormMode('view');
      }
    }
  };

  const handleGetCategory = async () => {
    if (!categoryIdInput.trim()) return;
    
    clearMessages();
    const categoryId = parseInt(categoryIdInput);
    if (isNaN(categoryId)) return;

    console.log('Getting category and switching to edit mode:', categoryId);
    const result = await getCategory(categoryId);
    if (result.success) {
      // Automatically switch to edit mode when category is loaded
      setFormMode('edit');
      // Immediately populate form data
      setFormData({
        CategoryName: result.data.CategoryName || '',
        CategoryDescription: result.data.CategoryDescription || ''
      });
      console.log('Auto-switched to edit mode with data:', result.data);
    }
  };

  const handleEdit = () => {
    if (currentCategory) {
      console.log('Switching to edit mode with category:', currentCategory); // Debug log
      setFormMode('edit');
      // Immediately set form data when switching to edit mode
      setFormData({
        CategoryName: currentCategory.CategoryName || '',
        CategoryDescription: currentCategory.CategoryDescription || ''
      });
    }
  };

  const handleDelete = async () => {
    if (!currentCategory) return;
    
    if (window.confirm(`Are you sure you want to delete category "${currentCategory.CategoryName}"?`)) {
      const result = await deleteCategory(currentCategory.CategoryID);
      if (result.success) {
        clearCurrentCategory();
        setFormMode('add');
        setCategoryIdInput('');
      }
    }
  };

  const handleNewCategory = () => {
    clearCurrentCategory();
    setFormData({ CategoryName: '', CategoryDescription: '' });
    setFormMode('add');
    setCategoryIdInput('');
    clearMessages();
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Category Management</h1>

          {/* Success Messages Only */}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {successMessage}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Category Form */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  {formMode === 'add' ? 'Add Category' : 
                   formMode === 'edit' ? 'Edit Category' : 'View Category'}
                </h2>
                <button
                  onClick={handleNewCategory}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  New Category
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    name="CategoryName"
                    value={formData.CategoryName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter category name"
                    required
                    disabled={loading}
                    readOnly={false}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category Description
                  </label>
                  <textarea
                    name="CategoryDescription"
                    value={formData.CategoryDescription}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter category description"
                    required
                    disabled={loading}
                    readOnly={false}
                  />
                </div>

                {formMode !== 'view' && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 
                     formMode === 'add' ? 'Add Category' : 'Update Category'}
                  </button>
                )}
              </form>

              {/* Always show action buttons when there's a current category */}
              {currentCategory && (
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 disabled:bg-gray-400"
                  >
                    {loading ? 'Deleting...' : '🗑️ Delete'}
                  </button>
                  <button
                    onClick={() => {
                      clearCurrentCategory();
                      setFormMode('add');
                      setCategoryIdInput('');
                      clearMessages();
                    }}
                    className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                  >
                    Clear & New
                  </button>
                </div>
              )}
            </div>

            {/* Right Column - Get Category */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Find Category</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category ID
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={categoryIdInput}
                      onChange={(e) => setCategoryIdInput(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter category ID"
                      min="1"
                    />
                    <button
                      onClick={handleGetCategory}
                      disabled={loading || !categoryIdInput.trim()}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Loading...' : 'Get'}
                    </button>
                  </div>
                </div>

                {/* No Category Found Message */}
                {!loading && categoryIdInput.trim() && !currentCategory && error && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center">
                      <div className="text-yellow-600 mr-2">ℹ️</div>
                      <div>
                        <p className="text-sm text-yellow-800">
                          No category found with ID "{categoryIdInput}"
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Please check the ID and try again, or create a new category.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {currentCategory && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-md">
                    <h3 className="font-medium mb-2">Current Category</h3>
                    <div className="text-sm space-y-1">
                      <p><strong>ID:</strong> {currentCategory.CategoryID}</p>
                      <p><strong>Name:</strong> {currentCategory.CategoryName}</p>
                      <p><strong>Description:</strong> {currentCategory.CategoryDescription}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Debug Section */}
          <div className="mt-8 bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium mb-2">Debug Information</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>Mode: {formMode}</p>
              <p>Loading: {loading ? 'Yes' : 'No'}</p>
              <p>Current Category: {currentCategory ? `${currentCategory.CategoryName} (ID: ${currentCategory.CategoryID})` : 'None'}</p>
              <p>Form Data: {JSON.stringify(formData)}</p>
              <p>Input Disabled: {formMode === 'view' ? 'Yes' : 'No'}</p>
              <p>Input ReadOnly: {formMode === 'view' ? 'Yes' : 'No'}</p>
            </div>
            
            {/* Force refresh button for debugging */}
            <button
              onClick={() => {
                console.log('Force refresh triggered');
                if (currentCategory && formMode === 'edit') {
                  setFormData({
                    CategoryName: currentCategory.CategoryName || '',
                    CategoryDescription: currentCategory.CategoryDescription || ''
                  });
                }
              }}
              className="mt-2 px-2 py-1 bg-gray-500 text-white text-xs rounded"
            >
              Force Refresh Form Data
            </button>
          </div>
        </div>
      </div>
    
  );
};

export default CategoryManagementPage;
