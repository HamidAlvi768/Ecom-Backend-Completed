// routes/product.mjs  (mounted at /api/products)
import express from 'express';
import { addProduct, getProducts, updateProduct, deleteProduct, getProduct, searchProduct } from '../Controllers/Product.mjs';
import upload from '../config/multerConfig.mjs';
import { adminOnly } from '../middleware/auth.mjs';

const router = express.Router();

// Public catalog
router.get('/', getProducts);
router.get('/search/:key', searchProduct);
router.get('/:id', getProduct);

// Admin only
router.post('/add', adminOnly, upload.single('image'), addProduct);
router.put('/update/:id', adminOnly, upload.single('image'), updateProduct);
router.delete('/delete/:id', adminOnly, deleteProduct);

export default router;
