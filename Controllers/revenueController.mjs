import Revenue from '../models/Revenue.mjs';

// Create a new revenue entry
export const createRevenue = async (req, res) => {
    try {
        const revenue = new Revenue(req.body);
        await revenue.save();
        res.status(201).json(revenue);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all revenue entries
export const getRevenues = async (req, res) => {
    try {
        const revenues = await Revenue.find();
        res.status(200).json(revenues);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a revenue entry
export const updateRevenue = async (req, res) => {
    try {
        const { id } = req.params;
        const revenue = await Revenue.findByIdAndUpdate(id, req.body, { new: true });
        if (!revenue) return res.status(404).json({ message: 'Revenue not found' });
        res.status(200).json(revenue);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a revenue entry
export const deleteRevenue = async (req, res) => {
    try {
        const { id } = req.params;
        const revenue = await Revenue.findByIdAndDelete(id);
        if (!revenue) return res.status(404).json({ message: 'Revenue not found' });
        res.status(204).json();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};