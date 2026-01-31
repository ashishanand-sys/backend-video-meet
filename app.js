import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import streamRoutes from "./routes/stream.routes.js";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/streams", streamRoutes);
app.use("/api/auth", authRoutes);
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

export default app;
