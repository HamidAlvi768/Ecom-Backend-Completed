import sellingProduct from '../models/sellingProducts.mjs';

// Create a new sellingproduct entry
export const createProduct = async (req, res) => {
    try {
        const sellingproduct = new sellingProduct(req.body);
        await sellingproduct.save();
        res.status(201).json(sellingproduct);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all sellingproduct entries
export const getProducts = async (req, res) => {
    try {
        const sellingproducts = await sellingProduct.find();
        res.status(200).json(sellingproducts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a sellingproduct entry
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const sellingproduct = await sellingProduct.findByIdAndUpdate(id, req.body, { new: true });
        if (!sellingproduct) return res.status(404).json({ message: 'sellingProduct not found' });
        res.status(200).json(sellingproduct);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a sellingproduct entry
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const sellingproduct = await sellingProduct.findByIdAndDelete(id);
        if (!sellingproduct) return res.status(404).json({ message: 'sellingProduct not found' });
        res.status(204).json();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};