import React, { useState, useEffect } from 'react';
import useLocationStore from '../store/LocationStore';

const LocationManagementPage = () => {
  const [formMode, setFormMode] = useState('add'); // 'add', 'edit', 'view'
  const [formData, setFormData] = useState({
    locationName: '',
    address1: '',
    address2: '',
    city: '',
    province: '',
    country: ''
  });
  const [locationIdInput, setLocationIdInput] = useState('');

  const {
    currentLocation,
    loading,
    error,
    successMessage,
    addLocation,
    updateLocation,
    getLocation,
    deleteLocation,
    clearMessages,
    setCurrentLocation,
    clearCurrentLocation
  } = useLocationStore();

  // Clear messages on component mount
  useEffect(() => {
    clearMessages();
  }, [clearMessages]);

  // Update form data when current location changes OR when switching to edit mode
  useEffect(() => {
    console.log('Effect triggered:', { currentLocation, formMode });
    if (currentLocation) {
      if (formMode === 'edit') {
        console.log('Setting form data from current location for edit mode:', currentLocation);
        setFormData({
          locationName: currentLocation.LocationName || '',
          address1: currentLocation.Address1 || '',
          address2: currentLocation.Address2 || '',
          city: currentLocation.City || '',
          province: currentLocation.Province || '',
          country: currentLocation.Country || ''
        });
      } else if (formMode === 'view') {
        // Even in view mode, populate the form data for immediate editing capability
        console.log('Setting form data from current location for view mode:', currentLocation);
        setFormData({
          locationName: currentLocation.LocationName || '',
          address1: currentLocation.Address1 || '',
          address2: currentLocation.Address2 || '',
          city: currentLocation.City || '',
          province: currentLocation.Province || '',
          country: currentLocation.Country || ''
        });
      }
    } else if (formMode === 'add') {
      console.log('Clearing form data for add mode');
      setFormData({
        locationName: '',
        address1: '',
        address2: '',
        city: '',
        province: '',
        country: ''
      });
    }
  }, [currentLocation, formMode]);

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

    if (!formData.locationName.trim() || !formData.address1.trim() || !formData.city.trim()) {
      return;
    }

    if (formMode === 'add') {
      const result = await addLocation(formData);
      if (result.success) {
        setFormData({
          locationName: '',
          address1: '',
          address2: '',
          city: '',
          province: '',
          country: ''
        });
      }
    } else if (formMode === 'edit' && currentLocation) {
      const result = await updateLocation(currentLocation.LocationID, formData);
      if (result.success) {
        setFormMode('view');
      }
    }
  };

  const handleGetLocation = async () => {
    if (!locationIdInput.trim()) return;
    
    clearMessages();
    const locationId = parseInt(locationIdInput);
    if (isNaN(locationId)) return;

    console.log('Getting location and switching to edit mode:', locationId);
    const result = await getLocation(locationId);
    if (result.success) {
      // Automatically switch to edit mode when location is loaded
      setFormMode('edit');
      // Immediately populate form data
      setFormData({
        locationName: result.data.LocationName || '',
        address1: result.data.Address1 || '',
        address2: result.data.Address2 || '',
        city: result.data.City || '',
        province: result.data.Province || '',
        country: result.data.Country || ''
      });
      console.log('Auto-switched to edit mode with data:', result.data);
    }
  };

  const handleEdit = () => {
    if (currentLocation) {
      console.log('Switching to edit mode with location:', currentLocation);
      setFormMode('edit');
      // Immediately set form data when switching to edit mode
      setFormData({
        locationName: currentLocation.LocationName || '',
        address1: currentLocation.Address1 || '',
        address2: currentLocation.Address2 || '',
        city: currentLocation.City || '',
        province: currentLocation.Province || '',
        country: currentLocation.Country || ''
      });
    }
  };

  const handleDelete = async () => {
    if (!currentLocation) return;
    
    if (window.confirm(`Are you sure you want to delete location "${currentLocation.LocationName}"?`)) {
      const result = await deleteLocation(currentLocation.LocationID);
      if (result.success) {
        clearCurrentLocation();
        setFormMode('add');
        setLocationIdInput('');
      }
    }
  };

  const handleNewLocation = () => {
    clearCurrentLocation();
    setFormData({
      locationName: '',
      address1: '',
      address2: '',
      city: '',
      province: '',
      country: ''
    });
    setFormMode('add');
    setLocationIdInput('');
    clearMessages();
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Location Management</h1>

        {/* Success Messages Only */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Location Form */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {formMode === 'add' ? 'Add Location' : 
                 formMode === 'edit' ? 'Edit Location' : 'View Location'}
              </h2>
              <button
                onClick={handleNewLocation}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                New Location
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Location Name *
                </label>
                <input
                  type="text"
                  name="locationName"
                  value={formData.locationName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter location name"
                  required
                  disabled={loading}
                  readOnly={false}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  name="address1"
                  value={formData.address1}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter address line 1"
                  required
                  disabled={loading}
                  readOnly={false}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="address2"
                  value={formData.address2}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter address line 2 (optional)"
                  disabled={loading}
                  readOnly={false}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter city"
                    required
                    disabled={loading}
                    readOnly={false}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Province
                  </label>
                  <input
                    type="text"
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter province"
                    disabled={loading}
                    readOnly={false}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter country"
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
                   formMode === 'add' ? 'Add Location' : 'Update Location'}
                </button>
              )}
            </form>

            {/* Always show action buttons when there's a current location */}
            {currentLocation && (
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
                    clearCurrentLocation();
                    setFormMode('add');
                    setLocationIdInput('');
                    clearMessages();
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                >
                  Clear & New
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Get Location */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Find Location</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Location ID
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={locationIdInput}
                    onChange={(e) => setLocationIdInput(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter location ID"
                    min="1"
                  />
                  <button
                    onClick={handleGetLocation}
                    disabled={loading || !locationIdInput.trim()}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : 'Get'}
                  </button>
                </div>
              </div>

              {/* No Location Found Message */}
              {!loading && locationIdInput.trim() && !currentLocation && error && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center">
                    <div className="text-yellow-600 mr-2">ℹ️</div>
                    <div>
                      <p className="text-sm text-yellow-800">
                        No location found with ID "{locationIdInput}"
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Please check the ID and try again, or create a new location.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentLocation && (
                <div className="mt-6 p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium mb-2">Current Location</h3>
                  <div className="text-sm space-y-1">
                    <p><strong>ID:</strong> {currentLocation.LocationID}</p>
                    <p><strong>Name:</strong> {currentLocation.LocationName}</p>
                    <p><strong>Address 1:</strong> {currentLocation.Address1}</p>
                    {currentLocation.Address2 && (
                      <p><strong>Address 2:</strong> {currentLocation.Address2}</p>
                    )}
                    <p><strong>City:</strong> {currentLocation.City}</p>
                    {currentLocation.Province && (
                      <p><strong>Province:</strong> {currentLocation.Province}</p>
                    )}
                    {currentLocation.Country && (
                      <p><strong>Country:</strong> {currentLocation.Country}</p>
                    )}
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
            <p>Current Location: {currentLocation ? `${currentLocation.LocationName} (ID: ${currentLocation.LocationID})` : 'None'}</p>
            <p>Form Data: {JSON.stringify(formData)}</p>
            <p>Input Disabled: {loading ? 'Yes' : 'No'}</p>
            <p>Input ReadOnly: {'No'}</p>
          </div>
          
          {/* Force refresh button for debugging */}
          <button
            onClick={() => {
              console.log('Force refresh triggered');
              if (currentLocation && formMode === 'edit') {
                setFormData({
                  locationName: currentLocation.LocationName || '',
                  address1: currentLocation.Address1 || '',
                  address2: currentLocation.Address2 || '',
                  city: currentLocation.City || '',
                  province: currentLocation.Province || '',
                  country: currentLocation.Country || ''
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

export default LocationManagementPage;
