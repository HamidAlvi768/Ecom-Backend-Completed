// db.mjs
import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

const url = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/ecommerce';

mongoose.connect(url).catch((err) => {
  console.error('Could not connect to MongoDB. Is the MongoDB service running?\n', err.message);
  process.exit(1);
});

const db = mongoose.connection;

db.on('connected', () => {
  console.log('Connected to MongoDB');
});

db.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});
