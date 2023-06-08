import express from "express";

import {
  getTransactions,
  getTransactionByUser,
  getTransactionsByUserAndReport,
  createTransaction,
  deleteAllTransactions,
  getTransactionByProduct,
} from "../controller/transactionController.js";
// import { access } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getTransactions);
router.get("/:id", getTransactionByUser);
router.get("/report/:id", getTransactionsByUserAndReport);
router.get("/product/:id", getTransactionByProduct);
router.post("/", createTransaction);
router.delete("/", deleteAllTransactions);
export default router;
