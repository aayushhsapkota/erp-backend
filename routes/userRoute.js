import express from "express";
const router = express.Router();

import { signin, signup, refresh, logout } from "../controller/userController.js";

router.post("/signin", signin);
router.post("/signup", signup);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;