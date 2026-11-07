// End-to-end API tests for the ecommerce backend. They call the real running server.
//
// Before running:  MongoDB running, `npm run seed` done once, and `npm start` in another terminal.
// Run:             npm test
//
// The tests create their own e2e-<timestamp> accounts, products and orders and delete them
// at the end, so your own data is left alone. The "frontends are served" checks are skipped
// when the store/dashboard dev servers aren't running.
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

const BACKEND_DIR = fileURLToPath(new URL("..", import.meta.url));
dotenv.config({ path: path.join(BACKEND_DIR, ".env") });

const ROOT = process.env.TEST_API_ORIGIN || `http://localhost:${process.env.PORT || 5000}`;
const API = `${ROOT}/api`;
const STORE = process.env.TEST_STORE_URL || "http://localhost:3000";
const DASH = process.env.TEST_DASHBOARD_URL || "http://localhost:3001";
const RUN = `e2e-${Date.now()}`;
const ADMIN = { email: "admin@example.com", password: "admin1234" }; // from seed.mjs
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

// ---------- helpers ----------
async function call(method, p, { token, body, form, headers = {}, rawBody } = {}) {
  const h = { ...headers };
  if (token) h.authorization = `bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (rawBody !== undefined) { payload = rawBody; h["content-type"] ??= "application/json"; }
  else if (body !== undefined) { payload = JSON.stringify(body); h["content-type"] = "application/json"; }
  const res = await fetch(p.startsWith("http") ? p : `${API}${p}`, { method, headers: h, body: payload });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = undefined; }
  return { status: res.status, body: json, text, headers: res.headers };
}
const productForm = (fields, file) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.append(k, String(v));
  if (file) f.append("image", new Blob([file.data], { type: file.type }), file.name);
  return f;
};

const created = { users: [], products: [], orders: [], files: [] };
let adminToken, cust, custToken, cust2Token, seedProducts;

before(async () => {
  const up = await fetch(`${ROOT}/`).then(() => true, () => false);
  assert.ok(up, `Backend is not running at ${ROOT}. Start it with "npm start" in another terminal.`);
  await mongoose.connect(process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/ecommerce");
  const a = await call("POST", "/login", { body: ADMIN });
  assert.equal(a.status, 200, "seeded admin must be able to log in (run npm run seed)");
  adminToken = a.body.auth;
  const s = await call("POST", "/signup", { body: { name: "E2E Customer", email: `${RUN}-a@example.com`, password: "secret12" } });
  assert.equal(s.status, 200);
  created.users.push(s.body.result.email);
  cust = s.body.result; custToken = s.body.auth;
  const s2 = await call("POST", "/signup", { body: { name: "E2E Customer 2", email: `${RUN}-b@example.com`, password: "secret12" } });
  created.users.push(s2.body.result.email);
  cust2Token = s2.body.auth;
  seedProducts = (await call("GET", "/products")).body;
});

after(async () => {
  for (const id of created.orders) await call("DELETE", `/orders/${id}`, { token: adminToken });
  for (const id of created.products) await call("DELETE", `/products/delete/${id}`, { token: adminToken });
  const db = mongoose.connection.db;
  await db.collection("orders").deleteMany({ email: { $regex: `^${RUN}` } });
  await db.collection("products").deleteMany({ name: { $regex: `^${RUN}` } });
  await db.collection("users").deleteMany({ email: { $regex: `^${RUN}` } });
  for (const f of created.files) fs.rmSync(path.join(BACKEND_DIR, f), { force: true });
  await mongoose.disconnect();
});

// ---------- tests ----------
describe("server basics", () => {
  it("GET / health check", async () => {
    const r = await call("GET", `${ROOT}/`);
    assert.equal(r.status, 200);
    assert.equal(r.body.status, "ok");
  });
  it("unknown /api route -> 404 JSON", async () => {
    const r = await call("GET", "/does-not-exist");
    assert.equal(r.status, 404);
    assert.equal(r.body.message, "Not found");
  });
  it("malformed JSON body -> 400 JSON, not a crash", async () => {
    const r = await call("POST", "/login", { rawBody: "{bad json" });
    assert.equal(r.status, 400);
    assert.ok(r.body?.message);
  });
  it("oversized JSON body (>100kb) -> 413", async () => {
    const r = await call("POST", "/login", { body: { email: "x", password: "y".repeat(200_000) } });
    assert.equal(r.status, 413);
  });
  it("server still healthy after bad requests", async () => {
    assert.equal((await call("GET", `${ROOT}/`)).status, 200);
  });
});

describe("CORS", () => {
  it("allows the store origin", async () => {
    const r = await call("GET", "/products", { headers: { origin: STORE } });
    assert.equal(r.headers.get("access-control-allow-origin"), STORE);
  });
  it("allows the dashboard origin, incl. preflight for authorized POST", async () => {
    const r = await call("OPTIONS", "/orders", {
      headers: { origin: DASH, "access-control-request-method": "PUT", "access-control-request-headers": "authorization,content-type" },
    });
    assert.ok([200, 204].includes(r.status));
    assert.equal(r.headers.get("access-control-allow-origin"), DASH);
    assert.match(r.headers.get("access-control-allow-methods") || "", /PUT/);
  });
  it("does not allow other websites", async () => {
    const r = await call("GET", "/products", { headers: { origin: "http://evil.example" } });
    assert.equal(r.headers.get("access-control-allow-origin"), null);
  });
});

describe("signup", () => {
  it("creates a customer and hides the password", async () => {
    assert.equal(cust.role, "customer");
    assert.equal(cust.password, undefined);
    assert.ok(custToken.split(".").length === 3, "returns a JWT");
  });
  it("ignores an attempt to sign up as admin", async () => {
    const r = await call("POST", "/signup", { body: { name: "X", email: `${RUN}-hacker@example.com`, password: "secret12", role: "admin" } });
    assert.equal(r.status, 200);
    created.users.push(r.body.result.email);
    assert.equal(r.body.result.role, "customer");
  });
  it("stores email in lowercase and trimmed", async () => {
    const r = await call("POST", "/signup", { body: { name: "Case", email: `  ${RUN}-CASE@Example.COM `, password: "secret12" } });
    assert.equal(r.status, 200);
    created.users.push(r.body.result.email);
    assert.equal(r.body.result.email, `${RUN}-case@example.com`);
  });
  it("rejects duplicate email (any letter case) with 409", async () => {
    const r = await call("POST", "/signup", { body: { name: "Dup", email: `${RUN}-A@EXAMPLE.com`, password: "secret12" } });
    assert.equal(r.status, 409);
  });
  it("rejects missing fields with 400", async () => {
    assert.equal((await call("POST", "/signup", { body: { email: `${RUN}-x@example.com` } })).status, 400);
    assert.equal((await call("POST", "/signup", { body: {} })).status, 400);
  });
  it("rejects passwords shorter than 6 characters", async () => {
    assert.equal((await call("POST", "/signup", { body: { name: "S", email: `${RUN}-short@example.com`, password: "123" } })).status, 400);
  });
  it("stores a bcrypt hash, never the plain password", async () => {
    const u = await mongoose.connection.db.collection("users").findOne({ email: `${RUN}-a@example.com` });
    assert.match(u.password, /^\$2[aby]\$10\$/);
  });
});

describe("login", () => {
  it("logs in and returns user + token", async () => {
    const r = await call("POST", "/login", { body: { email: `${RUN}-a@example.com`, password: "secret12" } });
    assert.equal(r.status, 200);
    assert.equal(r.body.user.email, `${RUN}-a@example.com`);
    assert.equal(r.body.user.password, undefined);
    assert.ok(r.body.auth);
  });
  it("email is case-insensitive", async () => {
    assert.equal((await call("POST", "/login", { body: { email: `${RUN}-A@Example.com`, password: "secret12" } })).status, 200);
  });
  it("wrong password and unknown email give the same 401 message", async () => {
    const a = await call("POST", "/login", { body: { email: `${RUN}-a@example.com`, password: "nope-nope" } });
    const b = await call("POST", "/login", { body: { email: `${RUN}-nobody@example.com`, password: "nope-nope" } });
    assert.equal(a.status, 401);
    assert.equal(b.status, 401);
    assert.equal(a.body.result, b.body.result);
  });
  it("missing fields -> 400", async () => {
    assert.equal((await call("POST", "/login", { body: { email: "a@b.c" } })).status, 400);
  });
});

describe("GET /me and tokens", () => {
  it("returns the logged-in user", async () => {
    const r = await call("GET", "/me", { token: custToken });
    assert.equal(r.status, 200);
    assert.equal(r.body.user.email, `${RUN}-a@example.com`);
    assert.equal(r.body.user.password, undefined);
  });
  it("no token -> 401", async () => assert.equal((await call("GET", "/me")).status, 401));
  it("garbage token -> 401", async () => assert.equal((await call("GET", "/me", { token: "abc.def.ghi" })).status, 401));
  it("token signed with another secret -> 401", async () => {
    const forged = jwt.sign({ id: cust._id, email: cust.email }, "not-the-real-secret");
    assert.equal((await call("GET", "/me", { token: forged })).status, 401);
  });
  it("expired token -> 401", async () => {
    const expired = jwt.sign({ id: cust._id, email: cust.email, exp: Math.floor(Date.now() / 1000) - 60 }, process.env.JWT_SECRET);
    const r = await call("GET", "/me", { token: expired });
    assert.equal(r.status, 401);
    assert.match(r.body.message, /expired/i);
  });
  it("token of a deleted account -> 401", async () => {
    const s = await call("POST", "/signup", { body: { name: "Gone", email: `${RUN}-gone@example.com`, password: "secret12" } });
    await mongoose.connection.db.collection("users").deleteOne({ email: `${RUN}-gone@example.com` });
    assert.equal((await call("GET", "/me", { token: s.body.auth })).status, 401);
  });
  it("forged token claiming admin email still uses the real account's role", async () => {
    const r = await call("GET", "/users", { token: jwt.sign({ id: cust._id, email: ADMIN.email }, process.env.JWT_SECRET) });
    assert.equal(r.status, 403);
  });
});

describe("products (public)", () => {
  it("lists products without login", async () => {
    const r = await call("GET", "/products");
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.body) && r.body.length >= 12);
    for (const p of r.body) {
      assert.equal(typeof p.price, "number", `${p.name} price is a number`);
      assert.ok(p.name && p.category && p.company);
    }
  });
  it("every product image is a path and is served", async () => {
    for (const p of seedProducts) {
      assert.match(p.image, /^\/uploads\//, `${p.name} image is a relative path`);
      const r = await fetch(`${ROOT}${p.image}`);
      assert.equal(r.status, 200, `${p.image} is served`);
    }
  });
  it("gets one product by id", async () => {
    const r = await call("GET", `/products/${seedProducts[0]._id}`);
    assert.equal(r.status, 200);
    assert.equal(r.body.name, seedProducts[0].name);
  });
  it("unknown id -> 404, malformed id -> 400", async () => {
    assert.equal((await call("GET", "/products/000000000000000000000000")).status, 404);
    assert.equal((await call("GET", "/products/not-an-id")).status, 400);
  });
  it("store search is case-insensitive", async () => {
    const r = await call("GET", "/products/search/POSTER");
    assert.equal(r.status, 200);
    assert.ok(r.body.length >= 4);
    assert.ok(r.body.every((p) => /poster/i.test(p.name + p.category + p.company)));
  });
  it("dashboard search route works too", async () => {
    const r = await call("GET", "/search/framed");
    assert.equal(r.status, 200);
    assert.ok(r.body.length >= 1);
  });
  it("regex special characters don't break search", async () => {
    for (const q of ["(", "[", "*", ".*", "\\"]) {
      const r = await call("GET", `/products/search/${encodeURIComponent(q)}`);
      assert.equal(r.status, 200, `search for ${q}`);
      assert.ok(Array.isArray(r.body));
    }
    assert.equal((await call("GET", `/products/search/${encodeURIComponent(".*")}`)).body.length, 0);
  });
});

describe("products (admin)", () => {
  let productId;
  it("add: anonymous 401, customer 403", async () => {
    const f = () => productForm({ name: `${RUN} Mug`, category: "Kitchen", company: "QA", price: 10 });
    assert.equal((await call("POST", "/add", { form: f() })).status, 401);
    assert.equal((await call("POST", "/add", { form: f(), token: custToken })).status, 403);
    assert.equal((await call("POST", "/products/add", { form: f(), token: custToken })).status, 403);
  });
  it("add: validates required fields and price", async () => {
    assert.equal((await call("POST", "/add", { token: adminToken, form: productForm({ name: `${RUN} X` }) })).status, 400);
    assert.equal((await call("POST", "/add", { token: adminToken, form: productForm({ name: `${RUN} X`, category: "c", company: "c", price: -5 }) })).status, 400);
    assert.equal((await call("POST", "/add", { token: adminToken, form: productForm({ name: `${RUN} X`, category: "c", company: "c", price: "abc" }) })).status, 400);
  });
  it("add: rejects non-image uploads", async () => {
    const r = await call("POST", "/add", {
      token: adminToken,
      form: productForm({ name: `${RUN} Bad`, category: "c", company: "c", price: 1 }, { data: "hello", type: "text/plain", name: "evil.txt" }),
    });
    assert.equal(r.status, 400);
    assert.match(r.body.message, /image/i);
  });
  it("add: rejects images over 5 MB with 413", async () => {
    const r = await call("POST", "/add", {
      token: adminToken,
      form: productForm({ name: `${RUN} Big`, category: "c", company: "c", price: 1 }, { data: Buffer.alloc(6 * 1024 * 1024), type: "image/png", name: "big.png" }),
    });
    assert.equal(r.status, 413);
    assert.ok(r.body?.message);
  });
  it("add: admin creates a product with an image", async () => {
    const r = await call("POST", "/add", {
      token: adminToken,
      form: productForm({ name: `${RUN} Mug`, category: "Kitchen", company: "QA Co", price: "19.999", description: "test" }, { data: PNG, type: "image/png", name: "mug.png" }),
    });
    assert.equal(r.status, 201);
    productId = r.body._id;
    created.products.push(productId);
    created.files.push(r.body.image);
    assert.equal(r.body.price, 20, "price rounded to cents");
    assert.match(r.body.image, /^\/uploads\/image-\d+\.png$/);
    const img = await fetch(`${ROOT}${r.body.image}`);
    assert.equal(img.status, 200);
    assert.match(img.headers.get("content-type"), /image\/png/);
  });
  it("new product is visible in the public catalog and search", async () => {
    assert.ok((await call("GET", "/products")).body.some((p) => p._id === productId));
    assert.ok((await call("GET", `/products/search/${encodeURIComponent(RUN)}`)).body.some((p) => p._id === productId));
  });
  it("update: anonymous 401, customer 403", async () => {
    assert.equal((await call("PUT", `/products/update/${productId}`, { form: productForm({ price: 1 }) })).status, 401);
    assert.equal((await call("PUT", `/products/update/${productId}`, { token: custToken, form: productForm({ price: 1 }) })).status, 403);
  });
  it("update: partial update keeps other fields and the image", async () => {
    const before = (await call("GET", `/products/${productId}`)).body;
    const r = await call("PUT", `/products/update/${productId}`, { token: adminToken, form: productForm({ price: 25, category: "Kitchenware" }) });
    assert.equal(r.status, 200);
    assert.equal(r.body.price, 25);
    assert.equal(r.body.category, "Kitchenware");
    assert.equal(r.body.name, before.name);
    assert.equal(r.body.company, before.company);
    assert.equal(r.body.image, before.image);
  });
  it("update: invalid price 400, unknown product 404", async () => {
    assert.equal((await call("PUT", `/products/update/${productId}`, { token: adminToken, form: productForm({ price: -1 }) })).status, 400);
    assert.equal((await call("PUT", "/products/update/000000000000000000000000", { token: adminToken, form: productForm({ price: 1 }) })).status, 404);
  });
  it("update: new image replaces the old one", async () => {
    const r = await call("PUT", `/products/update/${productId}`, { token: adminToken, form: productForm({}, { data: PNG, type: "image/png", name: "new.png" }) });
    assert.equal(r.status, 200);
    created.files.push(r.body.image);
    assert.equal((await fetch(`${ROOT}${r.body.image}`)).status, 200);
  });
  it("delete: customer 403, admin 200, then 404", async () => {
    const tmp = await call("POST", "/add", { token: adminToken, form: productForm({ name: `${RUN} Temp`, category: "c", company: "c", price: 1 }) });
    assert.equal((await call("DELETE", `/products/delete/${tmp.body._id}`, { token: custToken })).status, 403);
    assert.equal((await call("DELETE", `/products/delete/${tmp.body._id}`)).status, 401);
    assert.equal((await call("DELETE", `/products/delete/${tmp.body._id}`, { token: adminToken })).status, 200);
    assert.equal((await call("DELETE", `/products/delete/${tmp.body._id}`, { token: adminToken })).status, 404);
    assert.equal((await call("GET", `/products/${tmp.body._id}`)).status, 404);
  });
});

describe("orders", () => {
  const addr = { address: "1 Test Street", phoneNumber: "03001234567" };
  let order, p1, p2;
  before(() => { [p1, p2] = seedProducts; });

  it("placing an order requires login", async () => {
    assert.equal((await call("POST", "/orders", { body: { items: [{ _id: p1._id, amount: 1 }], ...addr } })).status, 401);
  });
  it("validates cart, quantities, products and address", async () => {
    const bad = [
      { items: [], ...addr },
      { items: [{ _id: p1._id, amount: 1 }] },
      { items: [{ _id: p1._id, amount: 1 }], address: "  ", phoneNumber: "1" },
      { items: [{ _id: p1._id, amount: 0 }], ...addr },
      { items: [{ _id: p1._id, amount: 101 }], ...addr },
      { items: [{ _id: p1._id, amount: 1.5 }], ...addr },
      { items: [{ _id: p1._id, amount: "two" }], ...addr },
      { items: [{ _id: p1._id }], ...addr },
      { items: [{ _id: "not-an-id", amount: 1 }], ...addr },
      { items: [{ _id: "000000000000000000000000", amount: 1 }], ...addr },
      { items: "everything", ...addr },
    ];
    for (const body of bad) {
      const r = await call("POST", "/orders", { token: custToken, body });
      assert.equal(r.status, 400, `expected 400 for ${JSON.stringify(body).slice(0, 80)} (got ${r.status})`);
    }
  });
  it("prices come from the database, not the request", async () => {
    const r = await call("POST", "/orders", {
      token: custToken,
      body: { items: [{ _id: p1._id, amount: 2, price: 0.01, name: "FREE" }], total: 0.01, email: "someone-else@example.com", status: "delivered", ...addr },
    });
    assert.equal(r.status, 201);
    order = r.body;
    created.orders.push(order._id);
    assert.equal(order.total, Math.round(p1.price * 2 * 100) / 100);
    assert.equal(order.items[0].price, p1.price);
    assert.equal(order.items[0].name, p1.name);
    assert.equal(order.email, `${RUN}-a@example.com`);
    assert.equal(order.status, "pending");
  });
  it("duplicate cart lines are merged and multi-item totals are right", async () => {
    const r = await call("POST", "/orders", {
      token: custToken,
      body: { items: [{ _id: p1._id, amount: 1 }, { _id: p2._id, amount: 3 }, { _id: p1._id, amount: 2 }], ...addr },
    });
    assert.equal(r.status, 201);
    created.orders.push(r.body._id);
    assert.equal(r.body.items.length, 2);
    assert.equal(r.body.items.find((i) => i.name === p1.name).amount, 3);
    assert.equal(r.body.total, Math.round((p1.price * 3 + p2.price * 3) * 100) / 100);
  });
  it("orders keep their price snapshot after a product changes", async () => {
    const tmp = await call("POST", "/add", { token: adminToken, form: productForm({ name: `${RUN} Snapshot`, category: "c", company: "c", price: 10 }) });
    created.products.push(tmp.body._id);
    const o = await call("POST", "/orders", { token: custToken, body: { items: [{ _id: tmp.body._id, amount: 1 }], ...addr } });
    created.orders.push(o.body._id);
    await call("PUT", `/products/update/${tmp.body._id}`, { token: adminToken, form: productForm({ price: 99 }) });
    const all = (await call("GET", "/orders", { token: adminToken })).body;
    const saved = all.find((x) => x._id === o.body._id);
    assert.equal(saved.items[0].price, 10);
    assert.equal(saved.total, 10);
    await call("DELETE", `/products/delete/${tmp.body._id}`, { token: adminToken });
    const again = await call("POST", "/orders", { token: custToken, body: { items: [{ _id: tmp.body._id, amount: 1 }], ...addr } });
    assert.equal(again.status, 400, "can't order a deleted product");
  });
  it("listing orders: anonymous 401, customer 403, admin sees them newest first", async () => {
    assert.equal((await call("GET", "/orders")).status, 401);
    assert.equal((await call("GET", "/orders", { token: custToken })).status, 403);
    const r = await call("GET", "/orders", { token: adminToken });
    assert.equal(r.status, 200);
    assert.ok(r.body.some((o) => o._id === order._id));
    const dates = r.body.map((o) => new Date(o.createdAt).getTime());
    assert.deepEqual(dates, [...dates].sort((a, b) => b - a));
  });
  it("status: each order has its own; invalid values rejected", async () => {
    const other = await call("POST", "/orders", { token: cust2Token, body: { items: [{ _id: p2._id, amount: 1 }], ...addr } });
    created.orders.push(other.body._id);
    assert.equal((await call("PUT", `/orders/${order._id}`, { token: custToken, body: { status: "shipped" } })).status, 403);
    for (const s of ["shipped", "delivered", "cancelled", "refunded", "pending"]) {
      const r = await call("PUT", `/orders/${order._id}`, { token: adminToken, body: { status: s } });
      assert.equal(r.status, 200);
      assert.equal(r.body.status, s);
    }
    await call("PUT", `/orders/${order._id}`, { token: adminToken, body: { status: "shipped" } });
    const all = (await call("GET", "/orders", { token: adminToken })).body;
    assert.equal(all.find((o) => o._id === order._id).status, "shipped");
    assert.equal(all.find((o) => o._id === other.body._id).status, "pending", "other orders unaffected");
    assert.equal((await call("PUT", `/orders/${order._id}`, { token: adminToken, body: { status: "lost" } })).status, 400);
    assert.equal((await call("PUT", "/orders/000000000000000000000000", { token: adminToken, body: { status: "shipped" } })).status, 404);
  });
  it("delete: customer 403, admin 200, then 404", async () => {
    const o = await call("POST", "/orders", { token: custToken, body: { items: [{ _id: p1._id, amount: 1 }], ...addr } });
    assert.equal((await call("DELETE", `/orders/${o.body._id}`, { token: custToken })).status, 403);
    assert.equal((await call("DELETE", `/orders/${o.body._id}`, { token: adminToken })).status, 200);
    assert.equal((await call("DELETE", `/orders/${o.body._id}`, { token: adminToken })).status, 404);
  });
});

describe("users and roles", () => {
  it("users list: anonymous 401, customer 403", async () => {
    assert.equal((await call("GET", "/users")).status, 401);
    assert.equal((await call("GET", "/users", { token: custToken })).status, 403);
  });
  it("admin sees users without passwords", async () => {
    const r = await call("GET", "/users", { token: adminToken });
    assert.equal(r.status, 200);
    assert.ok(r.body.some((u) => u.email === `${RUN}-a@example.com`));
    assert.ok(r.body.every((u) => u.password === undefined));
  });
  it("role changes apply immediately to existing tokens", async () => {
    const users = mongoose.connection.db.collection("users");
    await users.updateOne({ email: `${RUN}-a@example.com` }, { $set: { role: "admin" } });
    assert.equal((await call("GET", "/users", { token: custToken })).status, 200);
    await users.updateOne({ email: `${RUN}-a@example.com` }, { $set: { role: "customer" } });
    assert.equal((await call("GET", "/users", { token: custToken })).status, 403);
  });
});

describe("static files", () => {
  it("can't read files outside uploads/ (path traversal)", async () => {
    for (const p of ["/uploads/../.env", "/uploads/..%2f.env", "/uploads/%2e%2e/.env", "/uploads/..%5c.env", "/.env"]) {
      const r = await fetch(`${ROOT}${p}`);
      const text = await r.text();
      assert.notEqual(r.status, 200, `${p} must not be served`);
      assert.ok(!/MONGODB_URL|JWT_SECRET/.test(text), `${p} leaked .env`);
    }
  });
});

describe("frontends are served", () => {
  for (const [name, base, paths] of [["store", STORE, ["/", "/shop", "/cart", "/login"]], ["dashboard", DASH, ["/", "/dashboard", "/orders", "/login"]]]) {
    it(`${name} serves the app on ${paths.join(", ")}`, async (t) => {
      const up = await fetch(base).then(() => true, () => false);
      if (!up) return t.skip(`${name} dev server not running at ${base}`);
      for (const p of paths) {
        const r = await fetch(`${base}${p}`);
        assert.equal(r.status, 200, `${base}${p}`);
        assert.match(await r.text(), /<div id="root">/);
      }
    });
  }
});
