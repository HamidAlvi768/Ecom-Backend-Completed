import express from 'express';
import { createOrderOverview, getOrderOverviews, updateOrderOverview, deleteOrderOverview } from '../controllers/orderOverviewController.mjs';

const router = express.Router();

router.post('/', createOrderOverview);
router.get('/', getOrderOverviews);
router.put('/:id', updateOrderOverview);
router.delete('/:id', deleteOrderOverview);

export default router;