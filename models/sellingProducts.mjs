import mongoose from "mongoose";

// Best Selling Products Schema
const productSchema = new mongoose.Schema({
    id: Number,
    product: String,
    category: String,
    brand: String,
    price: Number,
    stock: Number,
    rating: Number,
    orders: Number,
    sales: String // Could also be a Number, depending on how you want to store sales
});

// Model
const SellingProduct = mongoose.model('sellingProduct', productSchema);

export default SellingProduct;