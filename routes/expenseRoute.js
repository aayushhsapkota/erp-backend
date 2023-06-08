import express from "express";
import {
  getExpense,
  createExpense,
  getExpenseById,
  getFilterExpense,
  updateExpenseById,
  deleteExpenseById,
} from "../controller/expenseController.js";

const router = express.Router();
router.get("/", getExpense);
router.get("/:id", getExpenseById);
router.get("/filter", getFilterExpense);
router.post("/", createExpense);
router.patch("/:id", updateExpenseById);
router.delete("/:id", deleteExpenseById);

export default router;
