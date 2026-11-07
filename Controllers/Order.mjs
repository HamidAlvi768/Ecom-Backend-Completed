import mongoose from "mongoose";
import Order, { ORDER_STATUSES } from "../models/Order.mjs";
import Product from "../models/Products.mjs";

const MAX_QTY = 100;

// POST /api/orders  (logged-in customer)
// Body: { items: [{ _id: <productId>, amount }], address, phoneNumber }
// Prices come from the database, never from the request.
export const addOrder = async (req, res) => {
  try {
    const { items, address, phoneNumber } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }
    if (!String(address || "").trim() || !String(phoneNumber || "").trim()) {
      return res.status(400).json({ message: "Address and phone number are required" });
    }

    // Merge duplicate lines and validate quantities
    const qtyById = new Map();
    for (const line of items) {
      const id = String(line?._id || "");
      const amount = Number(line?.amount);
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid product in cart" });
      }
      if (!Number.isInteger(amount) || amount < 1 || amount > MAX_QTY) {
        return res.status(400).json({ message: `Quantity must be between 1 and ${MAX_QTY}` });
      }
      qtyById.set(id, (qtyById.get(id) || 0) + amount);
    }

    const products = await Product.find({ _id: { $in: [...qtyById.keys()] } });
    if (products.length !== qtyById.size) {
      return res.status(400).json({ message: "Some items in your cart are no longer available" });
    }

    const orderItems = products.map((p) => ({
      product: p._id,
      name: p.name,
      price: p.price,
      image: p.image,
      amount: qtyById.get(String(p._id)),
    }));
    const total = Math.round(orderItems.reduce((sum, i) => sum + i.price * i.amount, 0) * 100) / 100;

    const order = await Order.create({
      user: req.user._id,
      email: req.user.email,
      items: orderItems,
      total,
      address: String(address).trim(),
      phoneNumber: String(phoneNumber).trim(),
    });
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders  (admin)
export const getOrders = async (req, res) => {
  try {
    res.json(await Order.find().sort({ createdAt: -1 }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/orders/:id  { status }  (admin)
export const updateOrder = async (req, res) => {
  try {
    if (!ORDER_STATUSES.includes(req.body.status)) {
      return res.status(400).json({ message: `status must be one of: ${ORDER_STATUSES.join(", ")}` });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/orders/:id  (admin)
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
