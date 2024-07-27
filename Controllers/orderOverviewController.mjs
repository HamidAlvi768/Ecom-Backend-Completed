import OrderOverview from '../models/Orders.mjs';

// Create a new order overview entry
export const createOrderOverview = async (req, res) => {
    try {
        const orderOverview = new OrderOverview(req.body);
        await orderOverview.save();
        res.status(201).json(orderOverview);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all order overview entries
export const getOrderOverviews = async (req, res) => {
    try {
        const orderOverviews = await OrderOverview.find();
        res.status(200).json(orderOverviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update an order overview entry
export const updateOrderOverview = async (req, res) => {
    try {
        const { id } = req.params;
        const orderOverview = await OrderOverview.findByIdAndUpdate(id, req.body, { new: true });
        if (!orderOverview) return res.status(404).json({ message: 'Order Overview not found' });
        res.status(200).json(orderOverview);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete an order overview entry
export const deleteOrderOverview = async (req, res) => {
    try {
        const { id } = req.params;
        const orderOverview = await OrderOverview.findByIdAndDelete(id);
        if (!orderOverview) return res.status(404).json({ message: 'Order Overview not found' });
        res.status(204).json();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};