const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'uos-timetable-development-secret-key';

/**
 * Authentication middleware that verifies the Express Backend session JWT.
 * Populates req.user with { uid } if valid, otherwise throws 401.
 */
module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn(`[AuthMiddleware] Failed: Authorization header is missing or malformed:`, authHeader ? 'malformed' : 'missing');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided or invalid format.'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verifies the custom backend session JWT securely across all modes
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { uid: decoded.uid };
    
    next();
  } catch (error) {
    console.error('[AuthMiddleware] Verification Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Access denied. Invalid or expired authentication token.'
    });
  }
};
