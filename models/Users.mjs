// models/Users.mjs
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: String,
  // "customer" accounts use the store; only "admin" accounts can use the dashboard.
  // New signups are always customers. Make an admin with:  npm run make-admin -- <email>
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
});

export default mongoose.model('User', userSchema);
