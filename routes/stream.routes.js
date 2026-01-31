import express from "express";
import { createStream, getStreams } from "../controllers/stream.controller.js";

const router = express.Router();

router.post("/", createStream);
router.get("/", getStreams);

export default router;
