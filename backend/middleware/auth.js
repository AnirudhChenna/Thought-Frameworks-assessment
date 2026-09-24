const jwt = require('jsonwebtoken');

// authenticate: WHO are you? Runs on every protected route.
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const secret = process.env.JWT_SECRET || 'support_ticket_jwt_secret_token_key_change_in_production_2026';
    req.user = jwt.verify(token, secret); // throws if invalid/expired
    next(); // valid — continue to the actual route handler
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// requireRole: WHAT are you allowed to do? Runs on role-protected routes.
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = {
  authenticate,
  requireRole,
  verifyToken: authenticate
};
