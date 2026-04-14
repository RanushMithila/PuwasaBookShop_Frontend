# Refund Module Documentation

> **Project:** Puwasa Bookshop POS System  
> **Module:** Refund  
> **Date:** 2026-04-12  
> **Version:** 1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Technologies Used](#technologies-used)
3. [Project Structure](#project-structure)
4. [Features](#features)
5. [API Endpoints](#api-endpoints)
6. [Refund Workflow](#refund-workflow)
7. [Components](#components)
8. [Current Project Stage](#current-project-stage)
9. [Bugs Found & Fixes Done](#bugs-found--fixes-done)

---

## Overview

The Refund module allows cashiers to process refunds for completed bills. Cashiers can look up a bill by its ID, select individual items and specify refund quantities, and process the refund. Upon successful processing, the system generates a **voucher code** that can be used as credit on future purchases. The module also supports email notification to the customer with refund details.

---

## Technologies Used

| Technology        | Version   | Purpose                              |
|-------------------|-----------|--------------------------------------|
| React             | 19.1.1    | UI framework                         |
| React Router DOM  | 7.8.0     | Navigation (HashRouter)              |
| Vite              | 7.1.3     | Dev server & bundler                 |
| TailwindCSS       | 3.4.14    | Utility-first CSS styling            |

### Backend
| Technology        | Purpose                              |
|-------------------|--------------------------------------|
| Python FastAPI    | REST API backend                     |
| AWS EC2           | Cloud hosting                        |

---

## Project Structure

```
frontend/src/
├── pages/
│   └── RefundPage.jsx             # Main refund page (477 lines)
├── components/
│   ├── RefundSuccessModal.jsx     # Post-refund success modal with copy, print, email
│   ├── AlertModal.jsx             # Reusable error/info alert
│   ├── Sidebar.jsx                # Navigation sidebar (includes Refund icon)
│   └── Layout.jsx                 # Layout wrapper with sidebar
├── services/
│   └── RefundService.js           # Refund API functions
│       ├── processRefund()        # POST /refund/refund
│       ├── sendRefundNotification() # POST /refund/refund/notify
│       └── getVoucherByCode()     # GET /voucher/search/{code}
├── routes/
│   └── AppRoutes.jsx              # Includes /refund route
```

---

## Features

### ✅ Implemented Features

#### Bill Lookup
- **Bill ID Search** — Enter a bill ID and load the complete bill with all line items
- **Bill Header Display** — Shows Bill #, Customer ID, Location, Total, and Discount
- **Enter Key Support** — Press Enter to trigger bill load

#### Item Selection for Refund
- **Checkbox Selection** — Click on any item row or checkbox to select it for refund
- **Refund Quantity** — Adjustable quantity per item (clamped between 1 and original quantity)
- **Row Highlighting** — Selected items highlighted in indigo
- **Line Total Calculation** — Real-time line total shown for selected items

#### Refund Summary Panel
- **Selected Items Count** — Shows number of items selected for refund
- **Refund Total** — Real-time computed refund total displayed prominently
- **Process Refund Button** — Disabled until items are selected and bill is loaded
- **Clear Button** — Resets the entire form

#### Refund Processing
- **API Integration** — Sends refund request with `BillID` and selected `Items` (BillDetailID + QTY)
- **Voucher Generation** — Backend returns a `RefundID` and `VoucherCode`
- **Voucher Details Fetch** — After refund, fetches full voucher details (expiry date, value) from voucher API

#### Success Modal (RefundSuccessModal)
- **Refund Summary** — Displays RefundID, VoucherCode, Expiry Date, Bill ID, and Refund Total
- **Copy to Clipboard** — One-click copy of voucher code
- **Print Voucher** — Print voucher via Electron IPC (writes `voucher.json` and triggers print)
- **Email Notification** — Send refund notification email to customer via API
- **Auto-Write Voucher** — Automatically writes `voucher.json` via IPC on successful refund

#### Validation
- **Bill ID Validation** — Must be a positive integer
- **Item Selection Required** — At least one item must be selected
- **Error Handling** — Graceful error messages for API failures

---

## API Endpoints

### Process Refund

| Property  | Value                                    |
|-----------|------------------------------------------|
| Method    | `POST`                                   |
| Endpoint  | `/api/v1/refund/refund`                  |
| Auth      | ✅ Required (Bearer token)               |
| Content   | `application/json`                       |

#### Request Body

```json
{
  "BillID": 123,
  "Items": [
    { "BillDetailID": 1, "QTY": 2 },
    { "BillDetailID": 3, "QTY": 1 }
  ]
}
```

#### Success Response

```json
{
  "status": true,
  "error_message": "",
  "message": "Refund processed successfully",
  "data": {
    "RefundID": 45,
    "VoucherCode": "VCH-ABC123"
  }
}
```

---

### Send Refund Notification

| Property  | Value                                           |
|-----------|--------------------------------------------------|
| Method    | `POST`                                           |
| Endpoint  | `/api/v1/refund/refund/notify?refund_id={id}&email={email}` |
| Auth      | ✅ Required (Bearer token)                       |

Sends an email notification to the customer with refund and voucher details.

---

### Get Voucher by Code

| Property  | Value                                    |
|-----------|------------------------------------------|
| Method    | `GET`                                    |
| Endpoint  | `/api/v1/voucher/search/{voucherCode}`   |
| Auth      | ✅ Required (Bearer token)               |

#### Response Data

```json
{
  "status": true,
  "data": {
    "Code": "VCH-ABC123",
    "Value": 1500.00,
    "ExpiryDate": "2026-07-12T00:00:00",
    "isUsed": false
  }
}
```

---

### Get Bill by ID

| Property  | Value                                    |
|-----------|------------------------------------------|
| Method    | `GET`                                    |
| Endpoint  | `/api/v1/billing/billing/{billId}`       |
| Auth      | ✅ Required (Bearer token)               |

#### Response Data Structure

```json
{
  "status": true,
  "data": {
    "BillID": 123,
    "CustomerID": 1,
    "LocationID": 1,
    "Total": 5000.00,
    "Discount": 200.00,
    "Details": [
      {
        "DetailID": 1,
        "ItemName": "Notebook A4",
        "UnitPrice": 250.00,
        "QTY": 4
      }
    ]
  }
}
```

---

## Refund Workflow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Enter Bill  │────▶│  Load Bill   │────▶│  Select Items &  │
│     ID       │     │  from API    │     │  Set Refund QTY  │
└──────────────┘     └──────────────┘     └──────────────────┘
                                                    │
                                                    ▼
┌──────────────────────────┐     ┌──────────────────────────┐
│  Success Modal           │◀────│  Process Refund          │
│  (Voucher Code, Print,   │     │  POST /refund/refund     │
│   Copy, Email)           │     │  → Returns VoucherCode   │
└──────────────────────────┘     └──────────────────────────┘
         │
         ▼
┌────────────────────┐
│  Optional Actions  │
│  • Copy Voucher    │
│  • Print Voucher   │
│  • Email Customer  │
└────────────────────┘
```

---

## Components

### RefundPage.jsx
The main page component containing:
- Bill ID search input with Enter key handler
- Bill header information bar
- Scrollable items table with checkboxes and quantity inputs
- Right-side refund summary panel with action buttons

### RefundSuccessModal.jsx
A modal dialog displayed after successful refund processing:
- Displays RefundID, VoucherCode, ExpiryDate, BillID, RefundTotal
- Copy voucher code to clipboard
- Print voucher via Electron IPC
- Send email notification to customer
- All actions have loading states and error handling

---

## Current Project Stage

**Status: ✅ Production-Ready (Active)**

- Full refund flow implemented and tested
- Voucher generation and validation working
- Email notification integration complete
- Print functionality via Electron IPC operational
- Integrated with billing module (voucher codes can be used as payment in Billing)

---

## Bugs Found & Fixes Done

| # | Bug Description | Status | Fix Applied |
|---|-----------------|--------|-------------|
| 1 | Email notification was using dummy/mock implementation | ✅ Fixed | Replaced with real API call to `/refund/refund/notify` endpoint using `refundId` and user-provided email |
| 2 | Voucher expiry date not displaying after refund | ✅ Fixed | Added secondary API call to `getVoucherByCode()` after refund to fetch full voucher details including `ExpiryDate` |
| 3 | Voucher value showing calculated total instead of actual API value | ✅ Fixed | Updated to use `voucherResp.data.Value` from the voucher API response |
| 4 | Print voucher not working without manual voucher.json write | ✅ Fixed | Added automatic `voucher.json` write via IPC immediately after successful refund (before showing modal) |

---

## Integration with Other Modules

### Billing Module
- Voucher codes generated by the Refund module can be used as a payment method in the Billing module
- The Billing module validates vouchers via `getVoucherByCode()` before applying them
- Voucher validation checks: expiry date, usage status (`isUsed`), and available value

### Customer Module
- Refund email notifications are sent to the customer's email address
- Customer data (CustomerID) is associated with the original bill

---

*Document generated on 2026-04-12 by Puwasa Bookshop Development Team.*
