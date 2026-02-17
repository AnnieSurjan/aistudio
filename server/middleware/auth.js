const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.');
  process.exit(1);
}
const JWT_EXPIRES_IN = '7d';

// Generate JWT token for a user
function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Cookie options for auth token
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

// Set auth token as httpOnly cookie
function setAuthCookie(res, token) {
  res.cookie('auth_token', token, COOKIE_OPTIONS);
}

// Clear auth cookie
function clearAuthCookie(res) {
  res.clearCookie('auth_token', { path: '/' });
}

// Middleware: verify JWT token from httpOnly cookie (fallback to Authorization header)
function requireAuth(req, res, next) {
  const token = req.cookies?.auth_token
    || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired, please login again' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Verify token and return decoded payload (for use outside middleware)
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { requireAuth, generateToken, verifyToken, setAuthCookie, clearAuthCookie };
