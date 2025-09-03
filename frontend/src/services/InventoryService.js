import httpClient from './HttpClient';

export const searchItemsByName = async (name, locationId = 1) => {
    try {
        const data = await httpClient.get(`/inventory/getItemName/${name}/${locationId}`);
        return data;
    } catch (error) {
        console.error('Search items by name failed:', error);
        throw error;
    }
};

export const getItemByBarcode = async (barcode, locationId = 1) => {
    try {
        const data = await httpClient.get(`/inventory/getItem/${barcode}/${locationId}`);
        return data;
    } catch (error) {
        console.error('Get item by barcode failed:', error);
        throw error;
    }
};

// Additional inventory methods
export const getInventory = async (locationId = 1) => {
    try {
        return await httpClient.get(`/inventory/location/${locationId}`);
    } catch (error) {
        console.error('Get inventory failed:', error);
        throw error;
    }
};

export const updateStock = async (itemId, quantity, locationId = 1) => {
    try {
        return await httpClient.put(`/inventory/item/${itemId}/stock`, {
            quantity,
            location_id: locationId
        });
    } catch (error) {
        console.error('Update stock failed:', error);
        throw error;
    }
};

export const addStock = async (itemId, quantity, locationId = 1) => {
    try {
        return await httpClient.post(`/inventory/item/${itemId}/add-stock`, {
            quantity,
            location_id: locationId
        });
    } catch (error) {
        console.error('Add stock failed:', error);
        throw error;
    }
};

export const getLowStockItems = async (locationId = 1) => {
    try {
        return await httpClient.get(`/inventory/low-stock/${locationId}`);
    } catch (error) {
        console.error('Get low stock items failed:', error);
        throw error;
    }
};