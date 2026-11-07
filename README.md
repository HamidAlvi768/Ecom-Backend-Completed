# Ecommerce Backend API

Express + MongoDB API for a small ecommerce project. It serves two React apps:

- **Store** (customers): [Ecommerce-Store](https://github.com/HamidAlvi768/Ecommerce-Store)
- **Admin dashboard**: [Ecom-Frontend-Completed](https://github.com/HamidAlvi768/Ecom-Frontend-Completed)

## Run it

Requires Node.js 18+ and MongoDB running locally.

```
npm install
npm run seed      # sample products + demo accounts
npm start         # http://localhost:5000
```

Settings live in `.env`:

| Variable | Default | Purpose |
|---|---|---|
| `MONGODB_URL` | `mongodb://127.0.0.1:27017/ecommerce` | Database |
| `JWT_SECRET` | – | Signs login tokens (set your own) |
| `PORT` | `5000` | API port |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:3001` | Sites allowed to call the API |

## Accounts and roles

- Anyone can sign up in the store; new accounts are **customers**.
- Only **admins** can use the dashboard. Make one with:
  `npm run make-admin -- someone@example.com` (add `--remove` to undo).
- `npm run seed` creates a demo customer and a demo admin for local testing
  (see `seed.mjs`).

## API

| Method | Path | Who |
|---|---|---|
| POST | `/api/signup`, `/api/login` | anyone |
| GET | `/api/me` | logged in |
| GET | `/api/products`, `/api/products/:id`, `/api/products/search/:key`, `/api/search/:key` | anyone |
| POST | `/api/add` (multipart, field `image`) | admin |
| PUT | `/api/products/update/:id` (multipart) | admin |
| DELETE | `/api/products/delete/:id` | admin |
| POST | `/api/orders` `{ items: [{ _id, amount }], address, phoneNumber }` | logged in |
| GET | `/api/orders` | admin |
| PUT / DELETE | `/api/orders/:id` (`{ status }` for PUT) | admin |
| GET | `/api/users` | admin |

Logged-in requests send `authorization: bearer <token>` (from login/signup).
Order prices are always taken from the database, not from the request.
Uploaded images are stored in `uploads/` and served at `/uploads/<file>`.
