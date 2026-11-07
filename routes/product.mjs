// routes/product.mjs  (mounted at /api/products)
import express from 'express';
import { addProduct, getProducts, updateProduct, deleteProduct, getProduct, searchProduct } from '../Controllers/Product.mjs';
import upload from '../config/multerConfig.mjs';
import { verifyToken } from '../middleware/auth.mjs';

const router = express.Router();

router.post('/add', upload.single('image'), addProduct);
router.get('/', verifyToken, getProducts);
router.get('/search/:key', searchProduct);
router.get('/:id', verifyToken, getProduct);
router.put('/update/:id', upload.single('image'), updateProduct);
router.delete('/delete/:id', deleteProduct);

export default router;
