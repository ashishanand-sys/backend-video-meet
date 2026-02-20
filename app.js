import dotenv from "dotenv";
import express from "express";
import cors from "cors"
import streamRoutes from "./routes/stream.routes.js";
import authRoutes from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();

// app.use(cors({
//   origin: [process.env.CLIENT_URL_OLD, process.env.CLIENT_URL_NEW, process.env.VITE_API_URL,"http://localhost:5173"],
//   credentials: true
// }));

app.use(cors({
  origin: ["http://localhost:5173"],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use("/api/streams", streamRoutes);
app.use("/api/auth", authRoutes);
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

export default app;
