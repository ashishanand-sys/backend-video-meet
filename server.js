import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import connectDB from "./config/db.js";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import User from "./models/user.model.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// ===== PRODUCTION ALLOWED ORIGINS =====
const allowedOrigins = [
  process.env.CLIENT_URL_OLD,
  process.env.CLIENT_URL_NEW,
 
].filter(Boolean);

if (allowedOrigins.length === 0) {
  throw new Error("No CLIENT_URL configured for production");
}

// Create HTTP server
const httpServer = http.createServer(app);

// Attach Socket.io (STRICT CORS)
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});


// ================= SOCKET AUTH =================
io.use(async (socket, next) => {
  try {
    const parsedCookies = cookie.parse(
      socket.handshake.headers.cookie || ""
    );

    const token = parsedCookies.token;

    if (!token) {
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.userId = decoded.id;

    const user = await User.findById(decoded.id).select("username");

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.username = user.username;

    next();
  } catch (err) {
    return next(new Error("Invalid token"));
  }
});


// ================= SOCKET EVENTS =================
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-room", (roomId, callback) => {
    if (!socket.userId) {
      if (typeof callback === "function") {
        return callback({
          success: false,
          message: "Unauthorized",
        });
      }
      return;
    }

    socket.join(roomId);

    socket.to(roomId).emit("user-connected", {
      socketId: socket.id,
      username: socket.username,
    });

    const existingUsers = [];
    const roomSockets = io.sockets.adapter.rooms.get(roomId);

    if (roomSockets) {
      for (const sid of roomSockets) {
        if (sid !== socket.id) {
          const s = io.sockets.sockets.get(sid);
          existingUsers.push({
            socketId: sid,
            username: s?.username || "User",
          });
        }
      }
    }

    socket.emit("existing-users", existingUsers);

    if (typeof callback === "function") {
      callback({
        success: true,
        username: socket.username,
      });
    }
  });

  socket.on("offer", (payload) => {
    io.to(payload.target).emit("offer", payload);
  });

  socket.on("answer", (payload) => {
    io.to(payload.target).emit("answer", payload);
  });

  socket.on("ice-candidate", (payload) => {
    io.to(payload.target).emit("ice-candidate", payload);
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];

    rooms.forEach((room) => {
      socket.to(room).emit("user-disconnected", {
        socketId: socket.id,
        username: socket.username,
      });
    });
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});


// ================= START SERVER =================
connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
});