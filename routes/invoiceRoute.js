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

import {auth, checkAdmin} from "../middleware/auth.js";


const router = express.Router();

router.get("/", auth,getInvoices);
router.get("/newInvoiceNo/:type",auth, NewInvoiceNo);
router.post("/",auth, createInvoice);
router.get("/:id",auth, getInvoice);
router.patch("/:id",auth, updateInvoice);
router.delete("/:id",auth,checkAdmin, deleteInvoice);
router.delete("/", auth, checkAdmin,deleteAllInvoices);
router.get("/client/:id",auth, getClientPurchaseHistory); //all invoices specific to that client excluding draft

export default router;
