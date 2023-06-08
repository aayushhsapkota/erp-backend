import express from "express";
import {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getClientPurchaseHistory,
  NewInvoiceNo,
  deleteAllInvoices,
} from "../controller/invoiceController.js";

const router = express.Router();

router.get("/", getInvoices);
router.get("/newInvoiceNo/:type", NewInvoiceNo);
router.post("/", createInvoice);
router.get("/:id", getInvoice);
router.patch("/:id", updateInvoice);
router.delete("/:id", deleteInvoice);
router.delete("/", deleteAllInvoices);
router.get("/client/:id", getClientPurchaseHistory);

export default router;
