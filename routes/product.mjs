// routes/productRoutes.js
import express from 'express';
import { addProduct, getProducts, updateProduct, deleteProduct } from '../Controllers/Product.mjs';
import upload from '../config/multerConfig.mjs';

const router = express.Router();

router.post('/add', upload.single('image'), addProduct);
router.get('/', getProducts);
router.put('/update/:id', upload.single('image'), updateProduct);
router.delete('/delete/:id', deleteProduct);

export default router;
