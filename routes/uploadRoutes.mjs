// routes/uploadRoute.js
import express from 'express';
import { uploadImage } from '../Controllers/uploadController.mjs';
import upload from '../multerConfig.js';

const router = express.Router();

router.post('/upload', upload.single('image'), uploadImage);

export default router;
