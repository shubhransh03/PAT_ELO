import mongoose from 'mongoose';
import User from '../models/User.js';
import { verifyToken } from '@clerk/clerk-sdk-node';
import { fail } from './respond.js';

const DEV_FALLBACK_USER_ID = '68af0aa5ec05fb08d70226d2'; // must be a valid ObjectId in your DB for best results

export async function verifyAuth(req, res, next) {
  try {
  // Test-mode override: allow tests to force a role without real auth
  if ((process.env.NODE_ENV || '').toLowerCase() === 'test') {
    const testRole = req.headers['x-test-role'];
    if (testRole) {
      req.auth = {
        userId: '000000000000000000000000',
        role: String(testRole),
        clerkUserId: 'test_user'
      };
      return next();
    }
  }
  const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
  const skipAuth = !isProd && (((process.env.SKIP_AUTH || '').toLowerCase() === 'true') || process.env.SKIP_AUTH === '1');
    const hasSecret = !!process.env.CLERK_SECRET_KEY;
    const authHeader = req.headers.authorization || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    // Dev fallback when explicitly allowed or misconfigured
    if (skipAuth || !hasSecret) {
      if (!hasSecret) {
        console.warn('Auth middleware: CLERK_SECRET_KEY not set. Falling back to dev auth.');
      }
      req.auth = {
        userId: DEV_FALLBACK_USER_ID,
        role: 'supervisor',
        clerkUserId: 'dev_clerk_user'
      };
      return next();
    }

    if (!bearer) {
      return fail(res, 401, 'Missing Authorization header');
    }

    // Verify the Clerk token
    const token = await verifyToken(bearer, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    const clerkUserId = token.sub;
    // Try to map Clerk user -> Mongo user when DB is available
    let mongoUserId = null;
    let role = token?.publicMetadata?.role || token?.metadata?.role || 'therapist';

    const dbReady = mongoose.connection?.readyState === 1;
    if (dbReady && clerkUserId) {
      try {
        const user = await User.findOne({ clerkUserId }).select({ _id: 1, role: 1 }).lean();
        if (user) {
          mongoUserId = String(user._id);
          role = user.role || role;
        }
      } catch (e) {
        console.warn('Auth mapping lookup failed:', e.message);
      }
    }

    // If we couldn’t map to a Mongo user (first login or missing record),
    // keep the Clerk user ID separate and use a dev-safe ObjectId for filters in dev without DB.
    if (!mongoUserId) {
      mongoUserId = dbReady ? null : DEV_FALLBACK_USER_ID; // null when DB ready, so downstream can guard
    }

    req.auth = {
      userId: mongoUserId || DEV_FALLBACK_USER_ID, // ensure downstream filters don’t crash
      role,
      clerkUserId,
      claims: token
    };
    return next();
  } catch (err) {
    console.error('Auth verification error:', err.message);
    return fail(res, 401, 'Invalid or expired token');
  }
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.auth) {
      return fail(res, 401, 'Authentication required');
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.auth.role)) {
      return fail(res, 403, `Access denied. Required roles: ${allowedRoles.join(', ')}`);
    }

    next();
  };
}

export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return fail(res, 400, 'Validation Error', errors);
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return fail(res, 400, 'Invalid ID');
  }

  // Duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return fail(res, 409, `Duplicate Entry: ${field} already exists`);
  }

  // Default error
  return fail(res, err.status || 500, err.message || 'Internal Server Error');
}
