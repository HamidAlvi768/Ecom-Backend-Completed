// models/Products.mjs
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  company: String,
  description: String,
  image: String
});

export default mongoose.model('Product', productSchema);
