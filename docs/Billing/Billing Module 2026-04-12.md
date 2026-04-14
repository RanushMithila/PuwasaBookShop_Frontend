# Billing Module Documentation

> **Project:** Puwasa Bookshop POS System  
> **Module:** Billing  
> **Date:** 2026-04-12  
> **Version:** 1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Technologies Used](#technologies-used)
3. [Project Structure](#project-structure)
4. [Features](#features)
5. [API Endpoints](#api-endpoints)
6. [State Management](#state-management)
7. [Components](#components)
8. [Current Project Stage](#current-project-stage)
9. [Bugs Found & Fixes Done](#bugs-found--fixes-done)

---

## Overview

The Billing module is the core POS (Point of Sale) functionality of the Puwasa Bookshop system. It enables cashiers to scan items via barcode, manage a shopping cart, apply payments (cash, card, cheque, voucher), and generate invoices. The module runs as an **Electron desktop application** wrapping a React-based frontend that communicates with a **Python FastAPI backend** deployed on AWS EC2.

---

## Technologies Used

### Frontend
| Technology        | Version   | Purpose                              |
|-------------------|-----------|--------------------------------------|
| React             | 19.1.1    | UI framework                         |
| React DOM         | 19.1.1    | DOM rendering                        |
| React Router DOM  | 7.8.0     | Client-side routing (HashRouter)     |
| Vite              | 7.1.3     | Build tool & dev server              |
| TailwindCSS       | 3.4.14    | Utility-first CSS styling            |
| Zustand           | 5.0.7     | Lightweight state management         |
| lodash.debounce   | 4.0.8     | Input debouncing                     |
| react-to-print    | 3.1.1     | Receipt printing                     |
| electron-pos-printer | 1.3.7  | POS thermal printer integration      |

### Electron Shell
| Technology        | Version   | Purpose                              |
|-------------------|-----------|--------------------------------------|
| Electron          | 29.1.5    | Desktop app framework                |
| electron-builder  | 26.0.12   | Packaging & distribution             |
| concurrently      | 8.2.2     | Parallel dev server execution        |
| cross-env         | 7.0.3     | Cross-platform env variables         |
| wait-on           | 9.0.3     | Wait for dev server readiness        |
| node-machine-id   | 1.1.12    | Unique device identification         |

### Backend
| Technology        | Purpose                              |
|-------------------|--------------------------------------|
| Python FastAPI    | REST API backend                     |
| Docker            | Containerized deployment             |
| AWS EC2           | Cloud hosting (ap-southeast-1)       |

### Backend API Base URL
- **Production:** `http://13.228.206.118/api/v1`
- **Development:** Proxied via Vite (`/api` → `http://18.141.63.39/`)

---

## Project Structure

```
PuwasaBookShop_Frontend/
├── frontend/                     # React application
│   ├── src/
│   │   ├── pages/
│   │   │   └── BillingPage.jsx   # Main billing page (2237 lines)
│   │   ├── components/
│   │   │   ├── BillingItemRow.jsx     # Individual item row in cart
│   │   │   ├── SummaryBox.jsx         # Order summary & payment panel
│   │   │   ├── SearchBar.jsx          # Item search bar
│   │   │   ├── SearchResults.jsx      # Search results dropdown
│   │   │   ├── Receipt.jsx            # Receipt template for printing
│   │   │   ├── CashInOutModal.jsx     # Cash in/out transactions
│   │   │   ├── CashCountModal.jsx     # End-of-day cash count
│   │   │   ├── TemporaryBillsModal.jsx# Held/temporary bills list
│   │   │   ├── SearchByNameModal.jsx  # Item search by name
│   │   │   ├── OpeningAmountModal.jsx # Opening cash amount entry
│   │   │   ├── AlertModal.jsx         # Reusable alert dialog
│   │   │   ├── ConfirmModal.jsx       # Confirmation dialog
│   │   │   ├── Sidebar.jsx            # Navigation sidebar
│   │   │   ├── Layout.jsx             # Layout wrapper with sidebar
│   │   │   └── Toast.jsx              # Toast notifications
│   │   ├── services/
│   │   │   ├── BillingService.js      # Billing API calls
│   │   │   ├── CashRegisterService.js # Cash register API calls
│   │   │   ├── CustomerService.js     # Customer lookup API calls
│   │   │   ├── AuthService.js         # Authentication API calls
│   │   │   ├── HttpClient.js          # Centralized HTTP client with token refresh
│   │   │   ├── TokenService.js        # JWT token management
│   │   │   ├── PrintingService.js     # Print functionality
│   │   │   └── UserService.js         # User/helper API calls
│   │   ├── store/
│   │   │   ├── BillingStore.js        # Zustand store for cart & billing state
│   │   │   ├── AuthStore.js           # Zustand store for auth tokens
│   │   │   └── TokenStore.js          # Token persistence store
│   │   └── routes/
│   │       └── AppRoutes.jsx          # Route definitions
│   ├── vite.config.js
│   └── package.json
├── electron/                     # Electron main process
│   ├── main.js                   # Main process entry
│   ├── preload.js                # Context bridge for IPC
│   ├── ipcHandlers/              # IPC handlers (print, machineId)
│   └── package.json
└── docs/                         # Documentation
    └── Billing/
```

---

## Features

### ✅ Implemented Features

#### Core Billing
- **Barcode Scanning** — Scan item barcodes to add items to the cart
- **Item Search by Name** — Modal-based search for items by name
- **Cart Management** — Add, remove, update quantity, and apply per-item discounts
- **Real-time Stock Validation** — Checks inventory levels before adding items
- **Multiple Payment Methods** — Supports Cash, Card, Cheque, and Voucher payments
- **Voucher Validation** — Validates voucher codes (checks expiry, usage status, and value) before bill completion
- **Change Calculation** — Automatically calculates and displays balance/change
- **Auto Cash Fill** — Cash field auto-populates with the remaining total when not manually edited

#### Bill Lifecycle
- **Bill Creation** — Creates a new bill record via API
- **Add Bill Details** — Adds line items to the bill
- **Complete Bill** — Finalizes the bill with payment information
- **Temporary Bills (Hold)** — Save incomplete bills and resume later
- **Cancel Bill** — Cancel and delete temporary bills
- **Credit Balance Tracking** — Tracks credit balance for ongoing bills

#### Cash Register
- **Device Registration** — Unique machine ID-based cash register identification
- **Opening Amount** — Prompts for opening cash amount at session start
- **Cash In/Out** — Record cash deposits and withdrawals during the day
- **Cash Count (Closing)** — End-of-day denomination-based cash count
- **Register State Checks** — Automatic open/closed state verification

#### Customer Management (in Billing)
- **Phone-Based Lookup** — Search customers by phone number with debounced input
- **Auto-Complete Suggestions** — Dropdown suggestions for matching customers
- **Customer Association** — Link a customer to the bill

#### Helper/Salesperson
- **Helper Assignment** — Searchable dropdown to assign a helper/salesperson to the bill
- **Helper Search** — Filter helpers by name

#### Printing
- **Receipt Preview** — Hidden receipt component for print rendering
- **Invoice Printing** — Print invoice via Electron IPC (Python script)
- **Post-Print Actions** — Automatic reset after printing

#### Authentication
- **JWT Token Management** — Access token + refresh token flow
- **Background Token Refresh** — Automatic token refresh every 25 minutes
- **Role-Based Access** — Role extracted from JWT for UI control
- **Session Persistence** — Tokens persisted via Zustand store

#### Keyboard Navigation
- **Item Code Entry** — Enter key triggers barcode search
- **Search Suggestions** — Arrow keys + Enter for navigating/selecting suggestions
- **Tab Navigation** — Focus management across input fields
- **F-Key Shortcuts** — Keyboard shortcuts for common actions

---

## API Endpoints

| Method | Endpoint                                      | Description                    | Auth |
|--------|-----------------------------------------------|--------------------------------|------|
| POST   | `/billing/billing`                            | Create a new bill              | ✅   |
| POST   | `/billing/details`                            | Add items to a bill            | ✅   |
| POST   | `/billing/billing/complete/{billId}`          | Complete bill with payment     | ✅   |
| GET    | `/billing/billing/{billId}`                   | Get bill by ID                 | ✅   |
| DELETE | `/billing/billing/cancel/{billId}`            | Cancel a temporary bill        | ✅   |
| GET    | `/billing/tempbills/{locationId}`             | List temporary bills           | ✅   |
| GET    | `/inventory/getItem/{barcode}/{locationId}`   | Search item by barcode         | ❌   |
| GET    | `/inventory/getItemQTY/{barcode}/{locationId}`| Get item stock quantity        | ❌   |
| GET    | `/inventory/getItemName/{name}/{locationId}`  | Search items by name           | ✅   |
| GET    | `/inventory/getAll/{locationId}`              | Get all inventory              | ✅   |
| GET    | `/cashregister/get/{deviceId}`                | Get register by device         | ✅   |
| POST   | `/cashregister/create`                        | Create new register            | ✅   |
| GET    | `/cashregister/isOpen/{deviceId}`             | Check if register is open      | ✅   |
| POST   | `/cashregister/setOpeningAmount`              | Set opening amount             | ✅   |
| POST   | `/cashregister/setClosingAmount`              | Set closing amount             | ✅   |
| POST   | `/cashregister/cashInOut`                     | Record cash in/out             | ✅   |
| GET    | `/customer/phone/{phone}`                     | Search customer by phone       | ✅   |
| GET    | `/voucher/search/{voucherCode}`               | Validate voucher code          | ✅   |
| POST   | `/auth/token`                                 | Login (OAuth2 password flow)   | ❌   |
| POST   | `/auth/refresh-token`                         | Refresh access token           | ❌   |
| GET    | `/user/me`                                    | Get current user info          | ✅   |

---

## State Management

### BillingStore (Zustand)
- `selectedItems` — Array of items in the cart
- `currentBillId` — Active bill ID
- `addItem()` — Add or increment item
- `removeItem()` — Remove item from cart
- `resetTransaction()` — Clear all cart data
- `getSubtotal()` / `getTotalDiscount()` / `getTotal()` / `getTotalItems()` — Computed values

### AuthStore (Zustand)
- `accessToken` / `refreshToken` — JWT tokens
- `user` — Current user info
- `location` / `LocationID` — Active location
- `deviceId` — Machine ID for cash register

---

## Current Project Stage

**Status: ✅ Production-Ready (Active Development)**

- Core billing flow is fully functional
- Deployed on AWS EC2 with Docker
- Electron desktop app builds and runs
- All payment methods implemented and tested
- Cash register lifecycle (open, in/out, close) complete
- Receipt printing via Electron IPC operational

---

## Bugs Found & Fixes Done

| # | Bug Description | Status | Fix Applied |
|---|-----------------|--------|-------------|
| 1 | Empty placeholder bills created on page load | ✅ Fixed | Removed automatic bill creation on mount; bills created only when items are added |
| 2 | Token refresh race conditions | ✅ Fixed | Implemented request queuing during token refresh in HttpClient |
| 3 | Duplicate items added on rapid Enter presses | ✅ Fixed | Added `isAddingItemRef` guard to prevent concurrent `selectSuggestedItem` calls |
| 4 | Customer suggestions reappearing after selection | ✅ Fixed | Moved `setShowCustomerSuggestions` from effect to onChange/onFocus handlers |
| 5 | Stale customer search results overwriting current | ✅ Fixed | Added `isActive` flag in effect cleanup to discard stale responses |
| 6 | Voucher validated after bill creation (abandoned bills on invalid voucher) | ✅ Fixed | Moved voucher validation before bill creation in `handleAddDetails` |
| 7 | Non-barcode items appearing in barcode search | ✅ Fixed | Added client-side `startsWith` filter on barcode field |
| 8 | Cash input auto-fill overwriting user input | ✅ Fixed | Added `userEditedCash` / `userEditedCard` / `userEditedCheque` flags |

---

*Document generated on 2026-04-12 by Puwasa Bookshop Development Team.*
