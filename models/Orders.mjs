import mongoose from "mongoose";

// Order Overview Data Schema
const orderOverviewSchema = new mongoose.Schema({
    name: String,
    value: Number,
    color: String
});

// Model
const Orders = mongoose.model('OrderOverview', orderOverviewSchema);

export default Orders;