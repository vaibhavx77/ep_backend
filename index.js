import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import supplierRoutes from "./routes/supplier.js";
import userRoutes from "./routes/user.js";
import auctionRoutes from "./routes/auction.js";
import bidRoutes from "./routes/bid.js";
import invitationRoutes from "./routes/invitation.js";
import currencyRate from "./routes/currencyRate.js";
import cron from "node-cron";
import Auction from "./models/auction.js";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import auctionQARoutes from "./routes/auctionQA.js";
import dutyRoutes from "./routes/dutyTable.js";
import { initAgenda } from './agenda.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
app.set("io", io);
initAgenda(io);

const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Use Auth Routes
app.use("/api/auth", authRoutes);
app.use("/api/supplier", supplierRoutes);
app.use("/api/user", userRoutes);
app.use("/api/auction", auctionRoutes);
app.use("/api/bid", bidRoutes);
app.use("/api/invitation", invitationRoutes);
app.use("/api/auction-qa", auctionQARoutes);
app.use("/api/import-duty", dutyRoutes);
app.use("/api/currency-rate", currencyRate);


// TODO: Import and use your route modules here
// Example: app.use("/api/users", userRoutes);
console.log(process.env.MONGODB_URI, "process.env.MONGODB_URI")
// MongoDB Connection
mongoose
  // .connect(process.env.MONGODB_URI, {
  //   useNewUrlParser: true,
  //   useUnifiedTopology: true,
  //   // useCreateIndex: true, // Uncomment if needed for your Mongoose version
  // })
  .connect(process.env.MONGODB_URI)

  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Run every minute to update auction statuses
cron.schedule("* * * * *", async () => {
  const now = new Date();

  // Activate scheduled auctions
  await Auction.updateMany(
    { status: "Scheduled", startTime: { $lte: now }, endTime: { $gt: now } },
    { $set: { status: "Active" } }
  );

  // End active auctions
  await Auction.updateMany(
    { status: "Active", endTime: { $lte: now } },
    { $set: { status: "Ended" } }
  );
});

io.on("connection", (socket) => {
  socket.on("joinAuction", (auctionId) => {
    socket.join(auctionId);
  });
  socket.on("disconnect", () => {});
});