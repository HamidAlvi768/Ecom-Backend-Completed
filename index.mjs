// index.mjs
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import productRoutes from './routes/product.mjs';
import userRoutes from './routes/user.mjs';
import revenueRoutes from './routes/revenueRoutes.mjs';
import orderOverviewRoutes from './routes/orderOverviewRoutes.mjs';
import sellingProductRoutes from './routes/sellingProductRoutes.mjs';
import { signup, login } from './Controllers/User.mjs';
import { addProduct, searchProduct } from './Controllers/Product.mjs';
import { addOrder, getOrders, updateOrder, deleteOrder } from './Controllers/Order.mjs';
import upload from './config/multerConfig.mjs';
import './db.mjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.resolve('uploads')));

app.get('/', (req, res) => res.json({ status: 'ok', api: '/api' }));

// Auth (paths the React apps call)
app.post('/api/signup', signup);
app.post('/api/login', login);

// Products
app.use('/api/products', productRoutes);
app.post('/api/add', upload.single('image'), addProduct); // dashboard "Product Upload"
app.get('/api/search/:key', searchProduct);               // dashboard product search

// Orders
app.post('/api/orders/add', addOrder);
app.get('/api/orders', getOrders);
app.put('/api/order/:id', updateOrder);
app.delete('/api/order/:id', deleteOrder);

// Users and dashboard stats
app.use('/api/users', userRoutes);
app.use('/api/revenues', revenueRoutes);
app.use('/api/order-overviews', orderOverviewRoutes);
app.use('/api/sellingProducts', sellingProductRoutes);

// Upload/validation errors -> JSON instead of an HTML stack trace
app.use((err, req, res, next) => {
  res.status(400).json({ message: err.message || 'Bad request' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
