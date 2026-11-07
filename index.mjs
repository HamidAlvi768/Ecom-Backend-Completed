// index.mjs
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import productRoutes from './routes/product.mjs';
import userRoutes from './routes/user.mjs';
import { signup, login, me } from './Controllers/User.mjs';
import { addProduct, searchProduct } from './Controllers/Product.mjs';
import { addOrder, getOrders, updateOrder, deleteOrder } from './Controllers/Order.mjs';
import upload from './config/multerConfig.mjs';
import { verifyToken, adminOnly } from './middleware/auth.mjs';
import './db.mjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Only the store and the dashboard may call the API from a browser.
// Set CORS_ORIGINS in .env (comma-separated) when they run somewhere else.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins }));

app.use(express.json());
app.use('/uploads', express.static(path.resolve('uploads')));

app.get('/', (req, res) => res.json({ status: 'ok', api: '/api' }));

// Accounts
app.post('/api/signup', signup);
app.post('/api/login', login);
app.get('/api/me', verifyToken, me);
app.use('/api/users', userRoutes); // admin

// Products: reading is public, changes are admin only
app.use('/api/products', productRoutes);
app.post('/api/add', adminOnly, upload.single('image'), addProduct); // dashboard "Product Upload"
app.get('/api/search/:key', searchProduct);                           // dashboard product search

// Orders: customers place them, admins manage them
app.post('/api/orders', verifyToken, addOrder);
app.get('/api/orders', adminOnly, getOrders);
app.put('/api/orders/:id', adminOnly, updateOrder);
app.delete('/api/orders/:id', adminOnly, deleteOrder);

app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));

// Errors -> JSON instead of an HTML stack trace, keeping the right status code
// (e.g. 400 malformed JSON, 413 body or upload too large)
app.use((err, req, res, next) => {
  const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : err.status || err.statusCode || 400;
  res.status(status).json({ message: status >= 500 ? 'Server error' : err.message || 'Bad request' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
