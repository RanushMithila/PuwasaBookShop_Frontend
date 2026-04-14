# Puwasa Bookshop POS System

A desktop Point of Sale (POS) application for **Puwasa Bookshop**, built with Electron, React, and FastAPI.

---

## Overview

This is the frontend repository for the Puwasa Bookshop POS system. It provides cashiers with a complete retail management interface including billing, refunds, customer registration, and cash register operations. The application runs as an **Electron desktop app** and communicates with a **FastAPI backend** deployed on AWS EC2.

## Tech Stack

| Layer     | Technology                           |
|-----------|--------------------------------------|
| Desktop   | Electron 29.1.5                      |
| Frontend  | React 19.1.1 + Vite 7.1.3           |
| Styling   | TailwindCSS 3.4.14                   |
| State     | Zustand 5.0.7                        |
| Routing   | React Router DOM 7.8.0 (HashRouter)  |
| Backend   | Python FastAPI (Docker on AWS EC2)   |

## Modules

| Module              | Description                                           | Status |
|---------------------|-------------------------------------------------------|--------|
| **Billing**         | Core POS — barcode scan, cart, payments, receipts      | ✅     |
| **Refund**          | Process refunds with voucher generation & email notify  | ✅     |
| **Customer**        | Register new customers with auto-generated passwords   | ✅     |
| **Cash Register**   | Opening/closing amounts, cash in/out, denomination count| ✅     |

## Project Structure

```
PuwasaBookShop_Frontend/
├── frontend/          # React app (Vite)
├── electron/          # Electron main process & IPC handlers
└── docs/              # Full documentation
    ├── Billing/       # Billing module docs
    ├── Customer/      # Customer module docs
    ├── Refund/        # Refund module docs
    └── Plans/         # Project implementation plans
```

## Getting Started

### Development

```bash
# Install dependencies
cd frontend && npm install
cd ../electron && npm install

# Run in development mode
cd electron
npm run dev
```

### Production Build

```bash
cd electron
npm run build
```

## Documentation

Full documentation for each module is available in the [`docs/`](./docs) folder. See [`docs/Plans/Project Implementation Plan 2026-04-12.md`](./docs/Plans/Project%20Implementation%20Plan%202026-04-12.md) for the complete project status overview.

---

*Puwasa Bookshop © 2026*