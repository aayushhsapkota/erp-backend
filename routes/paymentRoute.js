import express from "express";

import {
  createPayment,
  updatedPayment,
  deltePaymentMethod,
} from "../controller/paymentController.js";

import {auth, checkAdmin} from "../middleware/auth.js";


const router = express.Router();

router.post("/",auth, createPayment);
router.patch("/:id",auth, updatedPayment);
router.delete("/:id",auth,checkAdmin, deltePaymentMethod);

export default router;
