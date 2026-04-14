# Puwasa Bookshop POS — Frontend

The React-based frontend for the Puwasa Bookshop POS system.

## Tech Stack

- **React** 19.1.1 — UI framework
- **Vite** 7.1.3 — Build tool & dev server
- **TailwindCSS** 3.4.14 — Utility-first CSS
- **Zustand** 5.0.7 — State management
- **React Router DOM** 7.8.0 — Client-side routing (HashRouter)

## Pages

| Route       | Page                | Description                        |
|-------------|---------------------|------------------------------------|
| `/`         | LoginPage           | User authentication                |
| `/billing`  | BillingPage         | Core POS billing interface         |
| `/refund`   | RefundPage          | Refund processing with vouchers    |
| `/customer` | CustomerPage        | Customer registration form         |

## Key Services

| Service              | Purpose                             |
|----------------------|-------------------------------------|
| `HttpClient.js`      | Centralized HTTP with token refresh |
| `BillingService.js`  | Billing API calls                   |
| `RefundService.js`   | Refund & voucher API calls          |
| `CustomerService.js` | Customer registration & lookup      |
| `AuthService.js`     | Login & profile API calls           |
| `CashRegisterService.js` | Cash register operations        |
| `TokenService.js`    | JWT token management                |

## Development

```bash
npm install
npm run dev        # Start Vite dev server on :5173
npm run build      # Build to ../electron/dist-frontend
```

## API Proxy

In development, Vite proxies `/api` requests to the backend:

```
/api → http://18.141.63.39/
```

## Documentation

See [`../docs/`](../docs) for full module documentation.

---

*Part of the Puwasa Bookshop POS System*
