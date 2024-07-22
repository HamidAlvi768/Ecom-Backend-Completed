// cloudinaryConfig.js
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import '../db.mjs';

dotenv.config();

// cloudinary.config({
//   cloud_name: 'dqjhzzdio',
//   api_key: '716291783282632',
//   api_secret: '_fVrqDl4-WDR7k0pGgY2E_nK6HM'
// });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
