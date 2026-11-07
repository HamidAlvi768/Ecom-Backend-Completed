// controllers/Product.mjs
import Product from "../models/Products.mjs";

// Uploaded images are saved in ./uploads and served at /uploads/<file>
const imageUrl = (req) =>
  req.file ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}` : undefined;

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const addProduct = async (req, res) => {
  try {
    const { name, price, category, company, description } = req.body;
    const newProduct = await Product.create({
      name,
      price,
      category,
      company,
      description,
      image: imageUrl(req) || "",
    });
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    res.status(200).json(await Product.find());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    for (const field of ["name", "price", "category", "company", "description"]) {
      if (req.body[field] !== undefined && req.body[field] !== "") product[field] = req.body[field];
    }
    const newImage = imageUrl(req);
    if (newImage) product.image = newImage;

    await product.save();
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const searchProduct = async (req, res) => {
  try {
    const key = new RegExp(escapeRegex(req.params.key), "i");
    const products = await Product.find({
      $or: [{ name: key }, { category: key }, { company: key }],
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
