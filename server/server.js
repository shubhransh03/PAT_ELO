import dotenv from "dotenv";
import mongoose from "mongoose";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import app from "./src/app.js";
import { fail } from "./src/middleware/respond.js";
import { env, isProd, skipDb as shouldSkipDb } from "./src/config/env.js";

dotenv.config();

// Swagger/OpenAPI: mount only when ENABLE_API_DOCS=true (default off)
if (env.ENABLE_API_DOCS === true) {
  const swaggerSpec = swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Therapy CMS API',
        version: '1.0.0'
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Include a valid Bearer token in the Authorization header.'
          }
        },
        schemas: {
          SuccessResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              data: { description: 'Payload' }
            }
          },
          ErrorResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              error: { type: 'string' },
              details: { description: 'Optional error details' }
            }
          },
          User: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              role: { type: 'string', enum: ['therapist','supervisor','admin','patient'] },
              active: { type: 'boolean' },
              clerkUserId: { type: 'string' }
            }
          },
          Patient: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              caseStatus: { type: 'string' },
              assignedTherapist: { $ref: '#/components/schemas/User' },
              supervisor: { $ref: '#/components/schemas/User' }
            }
          },
          TherapyPlan: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              patient: { $ref: '#/components/schemas/Patient' },
              therapist: { $ref: '#/components/schemas/User' },
              status: { type: 'string', enum: ['draft','submitted','approved','needs_revision'] },
              updatedAt: { type: 'string', format: 'date-time' },
              submittedAt: { type: 'string', format: 'date-time' },
              reviewedAt: { type: 'string', format: 'date-time' }
            }
          },
          Session: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              patient: { $ref: '#/components/schemas/Patient' },
              therapist: { $ref: '#/components/schemas/User' },
              date: { type: 'string', format: 'date-time' },
              durationMin: { type: 'integer' }
            }
          },
          ProgressReport: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              patient: { $ref: '#/components/schemas/Patient' },
              therapist: { $ref: '#/components/schemas/User' },
              sessionCount: { type: 'integer' },
              submittedAt: { type: 'string', format: 'date-time' },
              reviewedAt: { type: 'string', format: 'date-time' }
            }
          },
          ClinicalRating: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              therapist: { $ref: '#/components/schemas/User' },
              supervisor: { $ref: '#/components/schemas/User' },
              createdAt: { type: 'string', format: 'date-time' }
            }
          },
          Notification: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              toUser: { $ref: '#/components/schemas/User' },
              title: { type: 'string' },
              message: { type: 'string' },
              read: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    },
    apis: ['./src/routes/*.js'] // JSDoc annotations in route files
  });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('API docs available at /api/docs');
}

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return fail(res, 400, 'Validation Error', errors);
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return fail(res, 400, `Duplicate Error: ${field} already exists`);
  }
  if (err.name === 'JsonWebTokenError') {
    return fail(res, 401, 'Invalid Token');
  }
  return fail(res, err.status || 500, err.message || 'Internal Server Error');
};

app.use(errorHandler);

const port = env.PORT;
const mongoUri = env.MONGODB_URI;
const skipDb = shouldSkipDb();

// Start server listener (factored so we can call after DB ready OR immediately if skipping DB)
 function startHttpServer() {
  if (app.locals.serverStarted) return; // idempotent
  app.locals.serverStarted = true;
  app.listen(port, () => {
    console.log(`API server running on port ${port}`);
    console.log(`Health: http://localhost:${port}/health`);
    if (skipDb && mongoose.connection.readyState !== 1) {
      console.warn('⚠️  Server started WITHOUT a MongoDB connection (SKIP_DB enabled).');
    }
  });
}

// If explicitly skipping DB, start HTTP server immediately and don't attempt to connect
if (skipDb) {
  console.warn('SKIP_DB=true detected. Starting API without connecting to MongoDB.');
  startHttpServer();
}

async function connectWithRetry(maxRetries = 30, delayMs = 5000) {
  if (!mongoUri) {
    if (skipDb) {
      console.warn('⚠️  No MONGODB_URI provided but SKIP_DB is set. Continuing without DB.');
      startHttpServer();
      return;
    }
    console.error('MONGODB_URI environment variable is required (or set SKIP_DB=true to bypass).');
    process.exit(1);
  }

  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    try {
      console.log(`Connecting to MongoDB (attempt ${attempt}/${maxRetries}) ...`);
  await mongoose.connect(mongoUri);
      console.log('✅ Connected to MongoDB');
      startHttpServer();
      return;
    } catch (err) {
      console.error(`MongoDB connection failed (attempt ${attempt}):`, err.message);
      if (attempt >= maxRetries) {
        if (skipDb) {
          console.warn('Proceeding without DB after max retries due to SKIP_DB flag.');
          startHttpServer();
          return;
        }
        console.error('Exceeded maximum MongoDB connection attempts. Exiting.');
        process.exit(1);
      }
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

// Only attempt DB connection when not skipping DB
if (!skipDb) {
  connectWithRetry();
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
    }
  } catch (e) {
    console.warn('Error during MongoDB shutdown:', e.message);
  } finally {
    process.exit(0);
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
    }
  } catch (e) {
    console.warn('Error during MongoDB shutdown:', e.message);
  } finally {
    process.exit(0);
  }
});
