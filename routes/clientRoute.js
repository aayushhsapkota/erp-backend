import express from "express";
import {
  createClient,
  createMultipleClient,
  deleteClient,
  getAllClient,
  updateClient,
  getClientById,
} from "../controller/clientController.js";

import {auth, checkAdmin} from "../middleware/auth.js";

const router = express.Router();

router.get("/",auth, getAllClient);
router.post("/",auth, createClient);
router.post("/multiple",auth, createMultipleClient);
router.patch("/:id",auth, updateClient);
router.delete("/:id", auth, checkAdmin,deleteClient);
router.get("/:id",auth, getClientById);
export default router;
