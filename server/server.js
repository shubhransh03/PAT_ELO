import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import mongoose from "mongoose";

import patientRoutes from "./src/routes/patients.js";
import planRoutes from "./src/routes/plans.js";
import sessionRoutes from "./src/routes/sessions.js";
import reportRoutes from "./src/routes/reports.js";
import ratingRoutes from "./src/routes/ratings.js";
import assignmentRoutes from "./src/routes/assignments.js";
import userRoutes from "./src/routes/users.js";
import notificationRoutes from "./src/routes/notifications.js";
import analyticsRoutes from "./src/routes/analytics.js";

dotenv.config();
const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Health check
app.get("/health", (_req, res) => res.json({ 
  ok: true, 
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development'
}));

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/progress-reports", reportRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);

// Legacy dashboard route (for backwards compatibility)
app.get("/api/dashboard", async (req, res) => {
  res.redirect("/api/analytics/dashboard");
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // MongoDB validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      error: 'Validation Error',
      messages: errors
    });
  }
  
  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      error: 'Duplicate Error',
      message: `${field} already exists`
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid Token',
      message: 'Authentication failed'
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

app.use(errorHandler);

const port = process.env.PORT || 4000;
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => {
      console.log(`API server running on port ${port}`);
      console.log(`Health check: http://localhost:${port}/health`);
    });
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});
