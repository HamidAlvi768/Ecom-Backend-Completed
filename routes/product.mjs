import express from "express";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProduct,
  getProductById,
} from "../Controllers/Product.mjs";

const router = express.Router();

router.route("/").get(getProducts).post(createProduct);

router
  .route("/:id")
  .put(updateProduct)
  .delete(deleteProduct)
  .get(searchProduct)
  .get(getProductById);



export default router;
