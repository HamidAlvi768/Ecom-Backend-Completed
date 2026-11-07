// controllers/Product.mjs
import Product from "../models/Products.mjs";

// Uploaded images are saved in ./uploads and served at /uploads/<file>.
// The database stores the path only ("/uploads/x.png"); the frontends add the
// backend's address, so images keep working if the backend moves to another host.
const imagePath = (req) => (req.file ? `/uploads/${req.file.filename}` : undefined);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePrice = (value) => {
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? Math.round(price * 100) / 100 : null;
};

// POST /api/add  (admin)
export const addProduct = async (req, res) => {
  try {
    const { name, category, company, description } = req.body;
    const price = parsePrice(req.body.price);
    if (!name || !category || !company || price === null) {
      return res.status(400).json({ message: "name, category, company and a valid price are required" });
    }
    const newProduct = await Product.create({
      name,
      price,
      category,
      company,
      description,
      image: imagePath(req) || "",
    });
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/products  (public)
export const getProducts = async (req, res) => {
  try {
    res.status(200).json(await Product.find());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/products/:id  (public)
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: "Invalid product id" });
  }
};

// PUT /api/products/update/:id  (admin)
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    for (const field of ["name", "category", "company", "description"]) {
      if (req.body[field] !== undefined && req.body[field] !== "") product[field] = req.body[field];
    }
    if (req.body.price !== undefined && req.body.price !== "") {
      const price = parsePrice(req.body.price);
      if (price === null) return res.status(400).json({ message: "Invalid price" });
      product.price = price;
    }
    const newImage = imagePath(req);
    if (newImage) product.image = newImage;

    await product.save();
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/products/delete/:id  (admin)
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/products/search/:key and /api/search/:key  (public)
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
