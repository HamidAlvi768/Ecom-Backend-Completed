// index.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import productRoutes from './routes/product.mjs';
import userRoutes from './routes/user.mjs';
import revenueRoutes from './routes/revenueRoutes.mjs';
import orderOverviewRoutes from './routes/orderOverviewRoutes.mjs';
import sellingProductRoutes from './routes/sellingProductRoutes.mjs';
import './db.mjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;



app.use(cors());
app.use(express.json());

app.use('/api/products', productRoutes);
app.use('/api/revenues', revenueRoutes);
app.use('/api/order-overviews', orderOverviewRoutes);
app.use('/api/sellingProducts', sellingProductRoutes);
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
