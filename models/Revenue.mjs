import mongoose from "mongoose";

// Revenue Data Schema
const revenueSchema = new mongoose.Schema({
    name: String,
    invested: Number,
    earnings: Number,
    expenses: Number
});

const Revenue = mongoose.model('Revenue', revenueSchema);

export default Revenue;