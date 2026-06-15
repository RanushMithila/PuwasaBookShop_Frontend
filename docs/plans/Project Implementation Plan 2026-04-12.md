# Puwasa Bookshop POS — Project Implementation Plan

> **Project:** Puwasa Bookshop POS System  
> **Date:** 2026-04-12  
> **Stage:** Initial Implementation Complete  
> **Version:** 1.0

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Module Status Summary](#module-status-summary)
4. [Detailed Module Status](#detailed-module-status)
5. [Infrastructure Status](#infrastructure-status)
6. [Pending / Future Work](#pending--future-work)
7. [Known Limitations](#known-limitations)
8. [Documentation Index](#documentation-index)

---

## Project Overview

Puwasa Bookshop POS is a desktop Point of Sale application built for bookshop retail operations. The system handles billing, refunds, customer management, cash register operations, and receipt printing. It is built as an **Electron desktop app** with a **React frontend** communicating with a **Python FastAPI backend** hosted on AWS EC2.

### Tech Stack Summary

| Layer        | Technology                                      |
|--------------|--------------------------------------------------|
| Desktop      | Electron 29.1.5                                  |
| Frontend     | React 19.1.1 + Vite 7.1.3 + TailwindCSS 3.4.14 |
| State        | Zustand 5.0.7                                    |
| Routing      | React Router DOM 7.8.0 (HashRouter)              |
| Backend      | Python FastAPI                                   |
| Deployment   | Docker on AWS EC2 (ap-southeast-1)               |
| API Base     | `http://18.141.63.39/api/v1`                     |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Electron Shell                      │
│  ┌───────────────────────────────────────────────┐  │
│  │              React Frontend (Vite)             │  │
│  │                                               │  │
│  │  ┌─────────┐  ┌─────────┐  ┌──────────────┐  │  │
│  │  │ Billing │  │ Refund  │  │   Customer   │  │  │
│  │  │  Page   │  │  Page   │  │ Registration │  │  │
│  │  └────┬────┘  └────┬────┘  └──────┬───────┘  │  │
│  │       │            │              │           │  │
│  │  ┌────▼────────────▼──────────────▼───────┐   │  │
│  │  │           Service Layer                │   │  │
│  │  │  HttpClient + TokenService + Zustand   │   │  │
│  │  └────────────────┬───────────────────────┘   │  │
│  └───────────────────┼───────────────────────────┘  │
│                      │                               │
│  IPC Handlers: Print, MachineID                      │
└──────────────────────┼───────────────────────────────┘
                       │ HTTPS / Proxy
               ┌───────▼───────┐
               │  AWS EC2      │
               │  FastAPI      │
               │  (Docker)     │
               └───────────────┘
```

---

## Module Status Summary

| Module                 | Status           | Route        | Sidebar Icon |
|------------------------|------------------|--------------|--------------|
| **Login**              | ✅ Complete      | `/login`     | —            |
| **Billing**            | ✅ Complete      | `/billing`   | 🧾           |
| **Refund**             | ✅ Complete      | `/refund`    | ↩️           |
| **Customer Registration** | ✅ Complete   | `/customer`  | 👤           |
| **Cash Register**      | ✅ Complete      | (in Billing) | —            |
| **Tenant Settings**    | ✅ Complete      | (Global)     | —            |

---

## Detailed Module Status

### 1. Login Module
**Status: ✅ Complete**

| Feature                         | Status |
|---------------------------------|--------|
| Username/password authentication | ✅     |
| OAuth2 password flow (form data) | ✅     |
| JWT access token + refresh token | ✅     |
| Auto-redirect on token expiry    | ✅     |
| Background token refresh (25min) | ✅     |
| Device ID retrieval via IPC      | ✅     |
| Location & user profile fetch    | ✅     |

---

### 2. Billing Module
**Status: ✅ Complete** — Core POS functionality

| Feature                          | Status |
|----------------------------------|--------|
| Barcode scanning / item search   | ✅     |
| Item search by name (modal)      | ✅     |
| Cart management (add/remove/qty) | ✅     |
| Per-item discount                | ✅     |
| Real-time stock validation       | ✅     |
| Multiple payments (Cash/Card/Cheque/Voucher) | ✅ |
| Voucher validation (expiry, used) | ✅    |
| Change calculation               | ✅     |
| Bill creation → details → complete flow | ✅ |
| Temporary bills (hold & resume)  | ✅     |
| Cancel bill                      | ✅     |
| Customer lookup by phone         | ✅     |
| Helper/salesperson assignment    | ✅     |
| Receipt printing (Electron IPC)  | ✅     |
| Keyboard navigation & shortcuts  | ✅     |

---

### 3. Refund Module
**Status: ✅ Complete**

| Feature                          | Status |
|----------------------------------|--------|
| Bill lookup by ID                | ✅     |
| Item selection with checkboxes   | ✅     |
| Adjustable refund quantity       | ✅     |
| Refund total calculation         | ✅     |
| Refund processing via API        | ✅     |
| Voucher code generation          | ✅     |
| Voucher details fetch            | ✅     |
| Copy voucher to clipboard        | ✅     |
| Print voucher via IPC            | ✅     |
| Email notification to customer   | ✅     |

---

### 4. Customer Registration Module
**Status: ✅ Complete** — Added 2026-04-12

| Feature                          | Status |
|----------------------------------|--------|
| Registration form (all fields)   | ✅     |
| Sectioned layout (Personal/Account/Address/Status) | ✅ |
| Auto-generated password (name+date) | ✅  |
| Password show/hide toggle        | ✅     |
| Active status toggle switch      | ✅     |
| Form validation                  | ✅     |
| API integration                  | ✅     |
| Sidebar navigation icon          | ✅     |

---

### 5. Cash Register Module
**Status: ✅ Complete** (Integrated within Billing)

| Feature                          | Status |
|----------------------------------|--------|
| Device registration (machine ID) | ✅     |
| Opening amount prompt            | ✅     |
| Cash in/out transactions         | ✅     |
| Cash count (closing)             | ✅     |
| Denomination-based counting      | ✅     |
| Register open/closed state check | ✅     |

---

### 6. Tenant Settings Module
**Status: ✅ Complete** — Added 2026-06-13

| Feature                          | Status |
|----------------------------------|--------|
| API Integration (`/tenant/settings`) | ✅ |
| Dynamic Logo loading             | ✅     |
| Dynamic Tenant Name loading      | ✅     |
| Fallback to local assets         | ✅     |
| Zustand state management         | ✅     |

---

## Infrastructure Status

| Component           | Status      | Details                          |
|---------------------|-------------|----------------------------------|
| Backend API         | ✅ Running  | FastAPI on AWS EC2 (Docker)      |
| Frontend Dev Server | ✅ Running  | Vite on localhost:5173           |
| Electron Shell      | ✅ Working  | Dev mode with hot reload         |
| API Proxy           | ✅ Working  | Vite proxy `/api` → EC2          |
| Production Build    | ✅ Working  | `electron-builder` → NSIS        |
| Docker Deployment   | ✅ Complete | `docker-compose` on EC2          |

---

## Pending / Future Work

### High Priority
- [ ] **Inventory Management Page** — Add/edit/delete products, manage stock levels
- [ ] **User Management Page** — Admin page to manage staff accounts and roles
- [ ] **Reports Dashboard** — Revenue, expenses, profit metrics & charts
- [ ] **Restock Module** — Batch restock items from suppliers

### Medium Priority
- [ ] **Customer List/Search Page** — View & search existing customers
- [ ] **Customer Edit** — Update existing customer information
- [ ] **Loyalty Points System** — Points accumulation and redemption
- [ ] **Sales History** — View past transactions with filters
- [ ] **Product Categories** — Category-based browsing and filtering
- [ ] **Barcode Printing** — Generate and print barcodes for items

### Low Priority
- [ ] **Multi-Location Support** — Switch between store locations
- [ ] **Offline Mode** — Queue transactions when internet is unavailable
- [ ] **Dashboard Overview** — Home page with daily sales summary
- [ ] **Dark Mode** — System-wide dark theme toggle
- [ ] **Auto-Update** — Electron auto-updater for desktop app

---

## Known Limitations

1. **Single Location** — Currently hardcoded to "Polonnaruwa" location; multi-location switching not yet implemented
2. **No Offline Support** — All operations require an active internet connection to reach the AWS-hosted backend
3. **Customer Registration Auth** — Uses authenticated endpoint; a non-logged-in user cannot self-register
4. **No Audit Trail** — No detailed logging of who performed which actions
5. **BillingPage Size** — `BillingPage.jsx` is 2237 lines; could benefit from component decomposition

---

## Documentation Index

All detailed module documentation is in the `docs/` folder:

| Document | Path |
|----------|------|
| Billing Module | `docs/Billing/Billing Module 2026-04-12.md` |
| Customer Registration | `docs/Customer/Customer Registration 2026-04-12.md` |
| Refund Module | `docs/Refund/Refund Module 2026-04-12.md` |
| **This Plan** | `docs/Plans/Project Implementation Plan 2026-04-12.md` |

---

*Plan created on 2026-04-12 — Initial State Snapshot*  
*Puwasa Bookshop Development Team*
