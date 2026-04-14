# Customer Registration Module Documentation

> **Project:** Puwasa Bookshop POS System  
> **Module:** Customer Registration  
> **Date:** 2026-04-12  
> **Version:** 1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Technologies Used](#technologies-used)
3. [Project Structure](#project-structure)
4. [Features](#features)
5. [API Endpoints](#api-endpoints)
6. [Form Fields](#form-fields)
7. [UI/UX Details](#uiux-details)
8. [Current Project Stage](#current-project-stage)
9. [Bugs Found & Fixes Done](#bugs-found--fixes-done)

---

## Overview

The Customer Registration module enables cashiers and staff to register new customer accounts directly from the POS application. It provides a clean, sectioned form interface accessible from the sidebar navigation. Customer data is sent to the backend API and stored in the system for use in billing, refunds, and loyalty tracking.

---

## Technologies Used

| Technology        | Version   | Purpose                              |
|-------------------|-----------|--------------------------------------|
| React             | 19.1.1    | UI framework                         |
| React Router DOM  | 7.8.0     | Navigation (HashRouter)              |
| Vite              | 7.1.3     | Dev server & bundler                 |
| TailwindCSS       | 3.4.14    | Utility-first CSS styling            |
| Zustand           | 5.0.7     | Auth state (token for API calls)     |

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
│   └── CustomerPage.jsx          # Customer registration form (433 lines)
├── components/
│   ├── Sidebar.jsx                # Navigation sidebar (includes Customer icon)
│   ├── Layout.jsx                 # Layout wrapper with sidebar
│   └── AlertModal.jsx             # Reusable alert/success dialog
├── services/
│   └── CustomerService.js         # Customer API functions
│       ├── registerCustomer()     # POST /customer/register
│       ├── getCustomerByPhone()   # GET /customer/phone/{phone}
│       └── searchCustomers()      # GET /customer/phone/{term}
├── routes/
│   └── AppRoutes.jsx              # Includes /customer route
```

---

## Features

### ✅ Implemented Features

#### Customer Registration Form
- **Sectioned Layout** — Form divided into 4 clear sections:
  - Personal Information (first name, last name, phone, date of birth)
  - Account Information (email, password)
  - Address Information (address1, address2, address3, city, province, country)
  - Status & Role (active toggle, role badge)
- **Form Validation** — Required field validation before submission (first name, last name, phone, email, password)
- **Success/Error Alerts** — Modal-based feedback on registration result

#### Password Management
- **Auto-Generated Password** — Password auto-generated as `{firstname}{YYYYMMDD}` (e.g., `pasan20260412`) when user leaves the first name field
- **Manual Override** — User can manually edit the auto-generated password; once edited, auto-generation stops
- **Password Visibility Toggle** — Eye icon button to show/hide password text
- **Reset on Clear** — Auto-generation re-enables when form is cleared

#### Active Status
- **Toggle Switch** — Sliding toggle button for active/inactive status
- **Default: Active** — Active status is set to `true` by default
- **Visual Indicator** — Green "Active" or gray "Inactive" badge beside the toggle

#### Role Management
- **Fixed Role** — Role is set to "Customer" and displayed as a read-only badge
- **Not Editable** — Role is sent in the API payload but cannot be changed by the user

#### Sidebar Navigation
- **Customer Icon** — 👤 icon added to the sidebar navigation
- **Active State Highlight** — Indigo highlight when on the customer page
- **Consistent Navigation** — Same sidebar pattern as Billing and Refund pages

---

## API Endpoints

### Register Customer

| Property  | Value                                    |
|-----------|------------------------------------------|
| Method    | `POST`                                   |
| Endpoint  | `/api/v1/customer/register`              |
| Auth      | ✅ Required (Bearer token)               |
| Content   | `application/json`                       |

#### Request Body

```json
{
  "firstname": "string",
  "lastname": "string",
  "phone": "string",
  "dateOfBirth": "2026-04-12",
  "Email": "user@example.com",
  "Password": "string",
  "address1": "string",
  "address2": "string",
  "address3": "string",
  "city": "string",
  "province": "string",
  "country": "string",
  "active": true,
  "role": "Customer"
}
```

#### Success Response

```json
{
  "status": true,
  "error_message": "",
  "message": "Account added successfully",
  "data": {}
}
```

#### Error Response

```json
{
  "status": false,
  "error_message": "Error description",
  "message": "Registration failed",
  "data": {}
}
```

### Lookup Customer by Phone

| Property  | Value                                    |
|-----------|------------------------------------------|
| Method    | `GET`                                    |
| Endpoint  | `/api/v1/customer/phone/{phone}`         |
| Auth      | ✅ Required (Bearer token)               |

> Used in the Billing module for customer association.

---

## Form Fields

| Field         | Type     | Required | Validation          | Default          |
|---------------|----------|----------|---------------------|------------------|
| firstname     | text     | ✅       | Non-empty           | —                |
| lastname      | text     | ✅       | Non-empty           | —                |
| phone         | tel      | ✅       | Non-empty           | —                |
| dateOfBirth   | date     | ❌       | Valid date           | Today's date     |
| Email         | email    | ✅       | Non-empty, email    | —                |
| Password      | password | ✅       | Non-empty           | Auto-generated   |
| address1      | text     | ❌       | —                   | —                |
| address2      | text     | ❌       | —                   | —                |
| address3      | text     | ❌       | —                   | —                |
| city          | text     | ❌       | —                   | —                |
| province      | text     | ❌       | —                   | —                |
| country       | text     | ❌       | —                   | —                |
| active        | boolean  | —        | —                   | `true`           |
| role          | string   | —        | —                   | `"Customer"`     |

---

## UI/UX Details

### Layout
- Full-height page with scrollable form area
- Maximum width of `max-w-4xl` for readability
- Responsive grid: 1 column (mobile) → 2 columns (tablet) → 3 columns (desktop)

### Design System
- **Color Scheme:** Indigo primary (`indigo-600`), gray neutrals
- **Cards:** White background, rounded-xl corners, subtle border and shadow
- **Section Headers:** Uppercase, small font with indigo dot indicator
- **Buttons:** Indigo primary button for submit, bordered secondary for clear
- **Active Toggle:** Custom sliding toggle with color transition animation
- **Badges:** Rounded-full pills for status (green/gray) and role (indigo)

### Interaction
- Auto-focus on first name field on page load
- Focus returns to first name after form submission or clear
- Password auto-fills on leaving first name field (blur event)
- Submit button shows "Registering…" loading state

---

## Current Project Stage

**Status: ✅ Implemented (2026-04-12)**

- Customer registration form fully functional
- API integration complete and tested
- Sidebar navigation added
- Route configured at `/customer`
- Password auto-generation with manual override
- Active toggle with visual feedback

---

## Bugs Found & Fixes Done

| # | Bug Description | Status | Fix Applied |
|---|-----------------|--------|-------------|
| 1 | InputField defined inside component caused focus loss on every keystroke | ✅ Fixed | Moved `InputField` component outside `CustomerPage` using `React.forwardRef` to prevent re-creation on re-renders |
| 2 | Password auto-generating on every keystroke in first name field | ✅ Fixed | Changed to generate only on `onBlur` (when user leaves the first name field) |
| 3 | `value` prop undefined warning from React (uncontrolled → controlled) | ✅ Fixed | Added `value = ""` default parameter in `InputField` component |
| 4 | Missing `displayName` warning for `forwardRef` component | ✅ Fixed | Added `InputField.displayName = "InputField"` |
| 5 | Password date format was DDMMYYYY instead of YYYYMMDD | ✅ Fixed | Updated `generatePassword` to use `${yyyy}${mm}${dd}` format |
| 6 | Auto-generated password not resetting after form clear | ✅ Fixed | Added `setPasswordManuallyEdited(false)` in `handleClear` and post-success reset |

---

*Document generated on 2026-04-12 by Puwasa Bookshop Development Team.*
