import mongoose from "mongoose";

// One document per customer email.
// order_data is a list of orders; each order is an array whose first entry is
// { Order_date } followed by the cart items ({ item: <product>, amount }).
// This is the shape both React apps read.
const orderSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    order_data: { type: Array, required: true },
    address: String,
    phoneNumber: String,
    status: { type: String, default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
