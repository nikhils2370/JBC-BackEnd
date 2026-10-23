import dotenv from "dotenv";
dotenv.config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const heroRoutes = require("./routes/heroRoutes");
const courseRoutes = require("./routes/courseRoutes");
const studentRoutes = require("./routes/studentRoutes");
const quizRoutes = require("./routes/quizRoutes");
const resultRoutes = require("./routes/resultRoutes");

const app = express();

// Trust Render proxy
app.set("trust proxy", 1);

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_PREVIEW,
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without Origin and configured frontend origins
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("Blocked CORS origin:", origin);
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsers
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    service: "JBC Education Full-Stack API",
    time: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/hero", heroRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/results", resultRoutes);

// Handle unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error("Express Error:", err.message);

  const isCorsError = err.message === "Origin not allowed by CORS";

  const statusCode = isCorsError
    ? 403
    : err.status && err.status < 500
      ? err.status
      : 500;

  res.status(statusCode).json({
    success: false,
    message: isCorsError
      ? "Origin not allowed"
      : statusCode < 500
        ? err.message
        : "Internal Server Error",
  });
});

// Start server
async function startServer() {
  try {
    await connectDB();

    // Render provides PORT as a port number.
    // 0.0.0.0 is the host, not the port.
    const PORT = Number(process.env.PORT) || 5000;
    const HOST = "0.0.0.0";

    const server = app.listen(PORT, HOST, () => {
      console.log(`JBC Backend running on ${HOST}:${PORT}`);
      console.log("Health check: /api/health");
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });

    server.on("error", (error) => {
      console.error("HTTP server error:", error);
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();