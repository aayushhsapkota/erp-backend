import express from "express";

import {
  getTransactions,
  getTransactionByUser,
  getTransactionsByUserAndReport,
  createTransaction,
  deleteAllTransactions,
  getTransactionByProduct,
} from "../controller/transactionController.js";

import {auth, checkAdmin} from "../middleware/auth.js";


const router = express.Router();

router.get("/",auth, getTransactions);
router.get("/:id",auth, getTransactionByUser);
router.get("/report/:id",auth, getTransactionsByUserAndReport);
router.get("/product/:id",auth, getTransactionByProduct);
router.post("/",auth, createTransaction);
router.delete("/", auth,checkAdmin,deleteAllTransactions);

export default router;
