import express from "express";
import { getRevenueData, getExpenseData, getRevenueByCategory,getStockData, getFinancialData, getCashFlowData } from "../controller/dashDataController.js";

const router = express.Router();

router.get("/revenueData", getRevenueData);
router.get("/expenseData", getExpenseData);
router.get("/revenueByCategory", getRevenueByCategory);
router.get("/stockData", getStockData);
router.get("/financialData", getFinancialData);
router.get("/cashFlowData", getCashFlowData);



export default router;

