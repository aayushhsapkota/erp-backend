import express from "express";
import {
  createClient,
  createMultipleClient,
  deleteClient,
  getAllClient,
  updateClient,
  getClientById,
} from "../controller/clientController.js";
// import { access } from "../middleware/auth.js";
const router = express.Router();
router.get("/", getAllClient);
router.post("/", createClient);
router.post("/multiple", createMultipleClient);
router.patch("/:id", updateClient);
router.delete("/:id", deleteClient);
router.get("/:id", getClientById);
export default router;
