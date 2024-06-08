// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from 'body-parser';
import productRoutes from "./routes/product.mjs";
import userRoutes from "./routes/user.mjs";
import uploadRoutes from "./routes/uploadRoutes.mjs";
import { fileURLToPath } from 'url';
import path from "path";
import './db.mjs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use('/upload', uploadRoutes);

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const PORT = process.env.PORT || 5000;




app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
