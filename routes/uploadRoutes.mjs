import express from 'express';
import { uploadFile, uploadResponse } from '../Controllers/uploadController.mjs';

const router = express.Router();
router.route('/').post(uploadFile, uploadResponse);

export default router;
