// models/Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  // userId: String,
  company: String,
});

export default mongoose.model('Product', productSchema);
