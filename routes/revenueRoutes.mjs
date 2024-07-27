import express from 'express';
import { createRevenue, getRevenues, updateRevenue, deleteRevenue } from '../controllers/revenueController.mjs';

const router = express.Router();

router.post('/', createRevenue);
router.get('/', getRevenues);
router.put('/:id', updateRevenue);
router.delete('/:id', deleteRevenue);

export default router;