// controllers/uploadController.js
import cloudinary from '../config/cloudinaryConfig.mjs';

export const uploadImage = async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path);
    res.status(200).json({
      message: 'Image uploaded successfully!',
      url: result.secure_url,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
