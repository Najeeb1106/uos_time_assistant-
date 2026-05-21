const { auth } = require('../config/firebase');

/**
 * Authentication middleware that verifies the Firebase ID token or Local JWT.
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
    
    // Verifies either real Firebase ID token or local custom signed JWT
    const decodedToken = await auth.verifyIdToken(token);
    req.user = { uid: decodedToken.uid };
    
    next();
  } catch (error) {
    console.error('[AuthMiddleware] Verification Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Access denied. Invalid or expired authentication token.'
    });
  }
};
