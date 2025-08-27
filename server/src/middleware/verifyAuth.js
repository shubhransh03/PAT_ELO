export function verifyAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  
  // For development - allow requests with or without token
  // In production, you would verify the Clerk JWT token here
  if (token) {
    // Token provided - validate it
    try {
      // TODO: Add Clerk JWT verification here
      // For now, accept any token as valid
      req.auth = { 
        userId: "68af0aa5ec05fb08d70226d2", // Use real supervisor ID from database
        role: "supervisor", 
        clerkUserId: "dev_clerk_user"
      };
    } catch (error) {
      return res.status(401).json({ 
        error: "Unauthorized", 
        message: "Invalid authentication token" 
      });
    }
  } else {
    // No token - for development, still allow with default user
    req.auth = { 
      userId: "68af0aa5ec05fb08d70226d2", // Use real supervisor ID from database
      role: "supervisor", 
      clerkUserId: "dev_clerk_user"
    };
  }
  
  next();
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ 
        error: "Unauthorized", 
        message: "Authentication required" 
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({ 
        error: "Forbidden", 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
}

export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid data provided',
      details: errors
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID',
      message: 'The provided ID is not valid'
    });
  }

  // Duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      error: 'Duplicate Entry',
      message: `${field} already exists`
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong'
  });
}
