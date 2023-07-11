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

import {auth, checkAdmin} from "../middleware/auth.js";


const router = express.Router();

router.get("/",auth, getproductPage);
router.get("/filter",auth, getfilterProduct);
router.post("/",auth,checkAdmin, createproductPage);
router.post("/multiple",auth,checkAdmin, createMultipleProduct);
router.patch("/quantity/:id", auth,checkAdmin, addOrReduceProductQuantity);
router.patch("/:id", auth,checkAdmin,updateProductById);
router.delete("/:id", auth, checkAdmin,deleteProductById);
router.get("/:id",auth, getProductById);
export default router;
