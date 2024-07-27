// controllers/productController.js
import Product from "../models/Products.mjs";
import cloudinary from "../config/cloudinaryConfig.mjs";

export const addProduct = async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path);
    const { name, price, category, company } = req.body;
    const newProduct = new Product({
      name,
      price,
      category,
      company,
      image: result.secure_url,
    });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProduct = async (req, res) => {
try {
    const product = await Product.findById(req.params.id);
    res.send(product);
} catch (error) {
  res.status(500).json({ error: error.message });
}
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description } = req.body;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.name = name || product.name;
    product.price = price || product.price;
    product.description = description || product.description;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      product.imageUrl = result.secure_url;
    }

    await product.save();
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    res.send(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const searchProduct = async (req, res) => {
  let products = await Product.find({
    $or: [
      { name: { $regex: req.params.key } },
      { category: { $regex: req.params.key } },
      { company: { $regex: req.params.key } },
    ],
  });
  res.send(products);
};
