import express from "express";
import { createStream, getStreams } from "../controllers/stream.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/",protect, createStream);
router.get("/",protect, getStreams);

export default router;
