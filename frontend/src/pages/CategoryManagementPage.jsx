import React, { useState, useEffect, useMemo } from "react";
import useCategoryStore from "../store/CategoryStore";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

const CategoryManagementPage = () => {
  const {
    categories,
    loading,
    error,
    successMessage,
    loadCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    clearMessages,
  } = useCategoryStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [modalMode, setModalMode] = useState("add"); // 'add' or 'edit'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    CategoryName: "",
    CategoryDescription: "",
  });
  const [toast, setToast] = useState(null);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Handle Toast notifications
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

  const filteredCategories = useMemo(() => {
    return categories
      .filter(
        (cat) =>
          cat.CategoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cat.CategoryDescription.toLowerCase().includes(
            searchTerm.toLowerCase()
          ) ||
          cat.CategoryID.toString().includes(searchTerm)
      )
      .sort((a, b) => a.CategoryID - b.CategoryID);
  }, [categories, searchTerm]);

  const handleOpenModal = (mode, category = null) => {
    setModalMode(mode);
    if (mode === "edit" && category) {
      setSelectedCategory(category);
      setFormData({
        CategoryName: category.CategoryName,
        CategoryDescription: category.CategoryDescription,
      });
    } else {
      setSelectedCategory(null);
      setFormData({
        CategoryName: "",
        CategoryDescription: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCategory(null);
    setFormData({ CategoryName: "", CategoryDescription: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (modalMode === "add") {
      const result = await addCategory(formData);
      if (result.success) handleCloseModal();
    } else {
      const result = await updateCategory(
        selectedCategory.CategoryID,
        formData
      );
      if (result.success) handleCloseModal();
    }
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (categoryToDelete) {
      await deleteCategory(categoryToDelete.CategoryID);
      setCategoryToDelete(null);
      setShowConfirmDelete(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto uppercase">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Category Management
            </h1>
            <p className="text-gray-500 mt-2 font-medium">
              Manage your inventory categories efficiently
            </p>
          </div>
          <button
            onClick={() => handleOpenModal("add")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-200 flex items-center gap-2"
          >
            <span>+</span> Add New Category
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm transition-all"
            />
          </div>
          <button
            onClick={() => loadCategories()}
            disabled={loading}
            className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-all shadow-sm flex items-center justify-center disabled:opacity-50"
            title="Refresh"
          >
            <span>🔄</span>
          </button>
        </div>

        {/* Categories Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">
                  Category Name
                </th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 relative">
              {loading && (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-emerald-600"
                  >
                    <div className="flex justify-center items-center gap-3 font-bold">
                      <span className="w-6 h-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
                      Fetching updated data...
                    </div>
                  </td>
                </tr>
              )}
              {filteredCategories.length === 0 && !loading ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-gray-400 italic font-medium"
                  >
                    No categories found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr
                    key={category.CategoryID}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-bold font-mono">
                        #{category.CategoryID}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {category.CategoryName}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium truncate max-w-xs">
                      {category.CategoryDescription}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          onClick={() => handleOpenModal("edit", category)}
                          className="px-3 py-1.5 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-all shadow-sm font-bold uppercase tracking-wider"
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(category)}
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

        {/* Category Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={handleCloseModal}
            ></div>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-zoom-in">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-extrabold text-gray-900 uppercase">
                  {modalMode === "add" ? "Add New Category" : "Edit Category"}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Category Name
                  </label>
                  <input
                    type="text"
                    name="CategoryName"
                    value={formData.CategoryName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold uppercase"
                    placeholder="Enter category name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    name="CategoryDescription"
                    value={formData.CategoryDescription}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium h-32 uppercase"
                    placeholder="Describe the category"
                  ></textarea>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-2 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-100 disabled:bg-gray-300 disabled:shadow-none uppercase flex items-center justify-center gap-2"
                  >
                    {loading && (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    )}
                    <span>
                      {loading
                        ? "Saving..."
                        : modalMode === "add"
                        ? "Add Category"
                        : "Save Changes"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirm Delete Modal */}
        <ConfirmModal
          isOpen={showConfirmDelete}
          onClose={() => setShowConfirmDelete(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Category"
          message={`Are you sure you want to delete the category "${categoryToDelete?.CategoryName}"? This action cannot be undone.`}
          confirmText="Delete Category"
          type="danger"
        />

        {/* Toast Notification */}
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

export default CategoryManagementPage;
