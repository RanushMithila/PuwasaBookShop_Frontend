# Tenant Settings Module

> **Date:** 2026-06-13
> **Module:** Tenant Settings
> **Status:** ✅ Complete

## Overview

The Tenant Settings module dynamically fetches configurations for the current authenticated tenant. This ensures the application reflects tenant-specific branding and configuration details, such as the company logo and display name, without hardcoding them in the application.

## API Integration

- **Endpoint**: `GET /api/v1/tenant/settings`
- **Requires Authentication**: Yes (Requires an active `accessToken`). The request is authenticated automatically using the existing `HttpClient` service.
- **Response Format**: An array of `SettingKey` and `SettingValue` pairs wrapped in a `data` array.

### Sample API Response Structure

```json
{
  "status": true,
  "data": [
    {
      "TenantSettingsID": 3,
      "SettingKey": "logo",
      "SettingValue": {
        "url": "https://loremflickr.com/320/240",
        "altText": null
      }
    },
    {
      "TenantSettingsID": 7,
      "SettingKey": "displayName",
      "SettingValue": {
        "text": "Demo Tenant"
      }
    }
  ]
}
```

## State Management (`useTenantStore`)

A Zustand store (`TenantStore.js`) is used to manage the fetched configuration. It retrieves and caches the tenant settings within the current session.

- **State Variables**:
  - `settings`: The raw settings array received from the API.
  - `logoUrl`: Parsed logo URL (`SettingValue.url` where `SettingKey` === "logo").
  - `tenantName`: Parsed display name (`SettingValue.text` where `SettingKey` === "displayName").
  - `isLoading`: Boolean state for tracking loading status.
  - `error`: Error messages from API failures.
- **Actions**:
  - `fetchSettings()`: Calls the API via `TenantService`, processes the specific keys out of the array, and updates the state. Skips refetching if data is already loaded.
  - `refreshSettings()`: Forces a refetch of the tenant configuration.
  - `clear()`: Clears the tenant store (e.g., used upon logout).

## Integration Points

### 1. `Sidebar.jsx` (Global Layout)
The `Sidebar` component mounts and executes `fetchSettings()`. It uses the resulting `logoUrl` from the state. 
- **Graceful Degradation**: If the API call fails or a logo URL is missing, it falls back to a locally packaged default logo (`/PUWASA LOGO.jpg`).
- **Error Handling on Rendering**: An `onError` handler is attached to the `img` tag. Should the external logo URL be broken or result in a 404, it immediately replaces the broken image with the local fallback.

## Implementation Files
- **Service**: `frontend/src/services/TenantService.js`
- **Store**: `frontend/src/store/TenantStore.js`
- **Consumer**: `frontend/src/components/Sidebar.jsx`
