// models/Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: String,
  price: String,
  category: String,
  // userId: String,
  company: String,
  image: String
});

export default mongoose.model('Product', productSchema);
