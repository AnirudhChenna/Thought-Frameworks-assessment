const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  // hash the password — 10 is the "cost factor"
  const hash = await bcrypt.hash(password, 10);
  try {
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), hash, 'customer']
    );

    const token = jwt.sign(
      { id: result.insertId, name: name.trim(), email: email.trim().toLowerCase(), role: 'customer' },
      process.env.JWT_SECRET || 'support_ticket_jwt_secret_token_key_change_in_production_2026',
      { expiresIn: '1d' }
    );

    res.status(201).json({
      success: true,
      id: result.insertId,
      token,
      user: {
        id: result.insertId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: 'customer'
      }
    });
  } catch (err) {
    // e.g. duplicate email
    res.status(400).json({
      success: false,
      error: 'Could not create user (email may already be registered)'
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
  if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: rows[0].id, name: rows[0].name, email: rows[0].email, role: rows[0].role },
    process.env.JWT_SECRET || 'support_ticket_jwt_secret_token_key_change_in_production_2026',
    { expiresIn: '1d' }
  );

  res.json({
    success: true,
    token,
    role: rows[0].role,
    user: {
      id: rows[0].id,
      name: rows[0].name,
      email: rows[0].email,
      role: rows[0].role
    }
  });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'support_ticket_jwt_secret_token_key_change_in_production_2026'
    );
    const [rows] = await pool.execute('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [decoded.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
