import dotenv from "dotenv";
import express from "express";
import cors from "cors"
import streamRoutes from "./routes/stream.routes.js";
import authRoutes from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL_OLD,
  process.env.CLIENT_URL_NEW,
  
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use("/api/streams", streamRoutes);
app.use("/api/auth", authRoutes);
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

export default app;
