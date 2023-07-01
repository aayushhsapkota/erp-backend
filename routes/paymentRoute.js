import express from "express";

import {
  createPayment,
  updatedPayment,
  deltePaymentMethod,
} from "../controller/paymentController.js";

// import {auth, checkAdmin} from "../middleware/auth.js";


const router = express.Router();

router.post("/", createPayment);
router.patch("/:id", updatedPayment);
router.delete("/:id", deltePaymentMethod);

export default router;
