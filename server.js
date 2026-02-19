import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import connectDB from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Create HTTP server from Express
const httpServer = http.createServer(app);

// Attach Socket.io (signaling only)
const io = new Server(httpServer, {
  cors: {
    origin:[process.env.CLIENT_URL_OLD, process.env.CLIENT_URL_NEW],
    methods: ["GET", "POST"],
  },
});

// Keep global tracking of streams if needed later
//const streamRooms = new Map();


//handle socket connections
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", socket.id);

    // Notify the user who just joined about existing users?
    // Actually, in mesh, usually the *existing* users initiate calls to the *new* user.
    // Or the new user initiates calls to *existing* (if they knew who they were).
    // The simplest pattern:
    // 1. A joins.
    // 2. Server tells B, C, D that "A joined".
    // 3. B, C, D each create an Offer and send to A.
    // 4. A receives 3 offers, creates 3 answers.
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

  

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
    // Broadcast to all rooms this socket was in
    // Since socket.io doesn't easily list rooms on disconnect without tracking, we rely on the client handle or broadcast globally (noisy)
    // Or we track it manually.
    // For this simple app, we can just let clients handle closure on failure,
    // OR significantly, we can use the 'disconnecting' event to see rooms.
  });
  
  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((room) => {
      socket.to(room).emit("user-disconnected", socket.id);
    });
  });
});

// Start after DB connects
connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
});
