import express from "express";
import { getCompany, updateCompany } from "../controller/companyController.js";
import { auth, checkAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, getCompany);
router.patch("/", auth, checkAdmin, updateCompany);

export default router;
