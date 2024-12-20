import express from "express";
import { getRevenueData, getExpenseData, getRevenueByCategory,getStockData, getFinancialData, getCashFlowData, getPurchaseData,getDayBookData, calculateMonthlyProfit } from "../controller/dashDataController.js";
import {auth, checkAdmin} from "../middleware/auth.js";

const router = express.Router();

router.get("/revenueData",auth,checkAdmin, getRevenueData);
router.get("/purchaseData",auth,checkAdmin, getPurchaseData);
router.get("/expenseData",auth,checkAdmin, getExpenseData);
router.get("/revenueByCategory",auth,checkAdmin, getRevenueByCategory);
router.get("/stockData",auth,checkAdmin, getStockData);
router.get("/financialData",auth,checkAdmin,getFinancialData);
router.get("/cashFlowData", auth,checkAdmin,getCashFlowData);
router.get("/dayBookData", auth,checkAdmin,getDayBookData);
router.get("/getMonthlyProfit",auth,checkAdmin,calculateMonthlyProfit);

export default router;

