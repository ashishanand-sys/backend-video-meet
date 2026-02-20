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

// Create HTTP server from Express
const httpServer = http.createServer(app);

// Attach Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});


// ================= SOCKET AUTH MIDDLEWARE =================
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

    // Look up username for display in meeting
    const user = await User.findById(decoded.id).select("username");
    socket.username = user ? user.username : "Guest";

    next();
  } catch (err) {
    return next(new Error("Invalid token"));
  }
});


// ================= SOCKET EVENTS =================
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // ===== JOIN ROOM =====
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

    // Notify others with username
    socket.to(roomId).emit("user-connected", {
      socketId: socket.id,
      username: socket.username,
    });

    // Send list of existing users (with usernames) to the joiner
    const existingUsers = [];
    const roomSockets = io.sockets.adapter.rooms.get(roomId);
    if (roomSockets) {
      for (const sid of roomSockets) {
        if (sid !== socket.id) {
          const s = io.sockets.sockets.get(sid);
          existingUsers.push({
            socketId: sid,
            username: s ? s.username : "Guest",
          });
        }
      }
    }
    socket.emit("existing-users", existingUsers);

    if (typeof callback === "function") {
      callback({ success: true, username: socket.username });
    }
  });


  // ===== WEBRTC SIGNALING =====
  socket.on("offer", (payload) => {
    io.to(payload.target).emit("offer", payload);
  });

  socket.on("answer", (payload) => {
    io.to(payload.target).emit("answer", payload);
  });

  socket.on("ice-candidate", (payload) => { 
    io.to(payload.target).emit("ice-candidate", payload);
  });


  // ===== DISCONNECT =====
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