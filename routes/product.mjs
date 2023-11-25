import express from "express";
import cors from "cors";
import mongoose from "mongoose";
// import productRoutes from './productRoutes.mjs';
import authRoutes from "./authRoutes.mjs";
import Product from "./models/Product.mjs";
import "./db.mjs";

const app = express();

// Connect to MongoDB here

app.use(cors());
app.use(express.json());

app.post("/add-products", async (req, res) => {
  let product = new Product(req.body);
  let result = await product.save();
  res.send(result);
});

app.get("/products", async (req, res) => {
  let product = await Product.find();
  if (product.length > 0) {
    res.send(product);
  } else {
    res.send({ result: "no result found" });
  }
});

app.get("/products/:id", async (req, res) => {
  const result = await Product.findOne({ _id: req.params.id });
  res.send(result);
});

app.put("/products/:id", async (req, res) => {
  const result = await Product.updateOne(
    { _id: req.params.id },
    { $set: req.body }
  );
  res.send(result);
});

app.get("/search/:key", async (req, res) => {
  let result = await Product.find({
    $or: [
      { name: { $regex: req.params.key } },
      { company: { $regex: req.params.key } },
      { category: { $regex: req.params.key } }
    ]
  });
  res.send(result);
});

