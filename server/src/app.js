const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");

const { Server } = require("socket.io");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const channelRoutes = require("./routes/channelRoutes");
const messageRoutes = require("./routes/messageRoutes");
const socketHandler = require("./sockets/socketHandler");

const memberRoutes = require("./routes/memberRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const taskRoutes = require("./routes/taskRoutes");
const activityRoutes = require("./routes/activityRoutes");

const uploadRoutes = require("./routes/uploadRoutes");

const userRoutes = require("./routes/userRoutes");

dotenv.config();

connectDB();

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/workspaces", workspaceRoutes);
app.use("/api/v1/channels", channelRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/members", memberRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/activities", activityRoutes);

app.get("/", (req, res) => {
  res.send("Backend is alive ");
});

app.get("/api/v1", (req, res) => {
  res.json({
    message: "API running successfully",
  });
});

app.use(
  "/api/v1/upload",
  uploadRoutes
);

app.use(
  "/uploads",
  express.static(
    "uploads"
  )
);

app.use(
  "/api/v1/users",
  userRoutes
);

socketHandler(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




/* eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZmVmZTM3ODlmYjM5YTNjNTk0M2QxZSIsImlhdCI6MTc4MTc2MTIzNSwiZXhwIjoxNzgyMzY2MDM1fQ.QXLgvbsvBCjIR5MGxUireETABj8CdUDA-i8aC-eCanU */ 