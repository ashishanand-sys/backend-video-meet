import express from "express";
import { register, login, getProfile, logout, updateUserProfile, changeUserPassword } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateUserProfile);
router.put("/change-password", protect, changeUserPassword);

export default router;
