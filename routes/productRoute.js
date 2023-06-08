import express from "express";
import {
  getproductPage,
  createproductPage,
  getProductById,
  getfilterProduct,
  updateProductById,
  deleteProductById,
  createMultipleProduct,
  addOrReduceProductQuantity,
} from "../controller/productController.js";

const router = express.Router();
router.get("/", getproductPage);
router.get("/filter", getfilterProduct);
router.post("/", createproductPage);
router.post("/multiple", createMultipleProduct);
router.patch("/quantity/:id", addOrReduceProductQuantity);
router.patch("/:id", updateProductById);
router.delete("/:id", deleteProductById);
router.get("/:id", getProductById);
export default router;
