import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import pinoHttp from "pino-http";
import client from "prom-client";
import { corsOrigins, isProd as envIsProd } from "./config/env.js";

import patientRoutes from "../src/routes/patients.js";
import planRoutes from "../src/routes/plans.js";
import sessionRoutes from "../src/routes/sessions.js";
import reportRoutes from "../src/routes/reports.js";
import ratingRoutes from "../src/routes/ratings.js";
import assignmentRoutes from "../src/routes/assignments.js";
import userRoutes from "../src/routes/users.js";
import notificationRoutes from "../src/routes/notifications.js";
import analyticsRoutes from "../src/routes/analytics.js";
import dataRoutes from "../src/routes/data.js";
import { fail } from "./middleware/respond.js";

const app = express();

// Security and middleware
const isProd = envIsProd();
const allowedOrigins = corsOrigins();

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // Allow same-origin and mobile apps
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 600,
}));

app.use(
  helmet({
    contentSecurityPolicy: isProd
      ? {
          useDefaults: true,
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'", ...allowedOrigins],
            frameAncestors: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
          },
        }
      : false, // Disable strict CSP in dev for tooling
    crossOriginEmbedderPolicy: false, // Avoid issues with vite/dev
  })
);

// Global baseline rate limit; specific routes override with their own
app.use(rateLimit({ windowMs: 60 * 1000, max: isProd ? 300 : 1000, standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Structured logging with request IDs and PII redaction
const logger = pinoHttp({
  genReqId: (req) => req.headers['x-request-id'] || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.email',
      'req.body.phone',
      'res.headers["set-cookie"]',
    ],
    remove: true,
  },
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});
app.use(logger);

// Prometheus metrics setup
client.collectDefaultMetrics();
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

// Track requests; route is set later in a finish handler
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const route = req.route?.path || req.originalUrl?.split('?')[0] || 'unknown';
    httpRequestCounter.inc({ method: req.method, route, status: String(res.statusCode) });
  });
  next();
});

// Health checks
app.get("/live", (_req, res) => res.json({ ok: true }));
app.get("/ready", (_req, res) => {
  const dbReady = mongoose.connection.readyState === 1; // 1: connected
  if (!dbReady) return res.status(503).json({ ok: false, db: 'disconnected' });
  return res.json({ ok: true });
});
app.get("/health", (_req, res) => res.json({ ok: true, timestamp: new Date().toISOString(), environment: process.env.NODE_ENV || 'development' }));

// Metrics endpoint (no auth)
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (e) {
    res.status(500).end(e.message);
  }
});

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
app.use("/api/data", dataRoutes);

// Legacy dashboard route (for backwards compatibility)
app.get("/api/dashboard", async (req, res) => {
  res.redirect("/api/analytics/dashboard");
});

// 404 handler
app.use('*', (req, res) => fail(res, 404, 'Not Found', `Route ${req.method} ${req.originalUrl} not found`));

export default app;
