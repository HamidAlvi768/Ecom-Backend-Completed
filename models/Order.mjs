import mongoose from "mongoose";

// One document per checkout.
// Item names and prices are copied from the products collection when the order
// is placed, so later product edits don't change past orders.
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    price: Number,
    image: String,
    amount: { type: Number, min: 1 },
  },
  { _id: false }
);

export const ORDER_STATUSES = ["pending", "shipped", "delivered", "cancelled", "refunded"];

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true },
    address: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: "pending" },
  },
  { timestamps: true } // createdAt = order date
);

export default mongoose.model("Order", orderSchema);
