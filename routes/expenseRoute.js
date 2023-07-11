import express from "express";
import {
  getExpense,
  createExpense,
  getExpenseById,
  getFilterExpense,
  updateExpenseById,
  deleteExpenseById,
} from "../controller/expenseController.js";

import {auth, checkAdmin} from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth,getExpense);
router.get("/:id",auth, getExpenseById);
router.get("/filter",auth, getFilterExpense);
router.post("/",auth, createExpense);
router.patch("/:id",auth, updateExpenseById);
router.delete("/:id",auth,checkAdmin, deleteExpenseById);

export default router;
