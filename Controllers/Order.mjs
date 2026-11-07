import Order from "../models/Order.mjs";

// POST /api/orders/add  { order_data, email, order_date, address, phoneNumber }
export const addOrder = async (req, res) => {
  try {
    const { order_data, email, order_date, address, phoneNumber } = req.body;
    if (!email || !Array.isArray(order_data) || order_data.length === 0) {
      return res.status(400).json({ message: "email and order_data are required" });
    }
    const data = [{ Order_date: order_date || new Date().toDateString() }, ...order_data];

    const existing = await Order.findOne({ email });
    if (existing) {
      existing.order_data.push(data);
      existing.markModified("order_data");
      if (address) existing.address = address;
      if (phoneNumber) existing.phoneNumber = phoneNumber;
      existing.status = "pending";
      await existing.save();
    } else {
      await Order.create({ email, order_data: [data], address, phoneNumber });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders
export const getOrders = async (req, res) => {
  try {
    res.json(await Order.find().sort({ updatedAt: -1 }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/order/:id  { status }
export const updateOrder = async (req, res) => {
  try {
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

// DELETE /api/order/:id
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
