const router = require('express').Router();
const pool = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

// GET /api/users - Agent access
router.get('/', requireRole('agent'), async (req, res) => {
  const { role } = req.query;
  let sql = 'SELECT id, name, email, role, created_at FROM users';
  const params = [];
  if (role) {
    sql += ' WHERE role = ?';
    params.push(role);
  }
  sql += ' ORDER BY name ASC';
  const [users] = await pool.execute(sql, params);
  res.json({ success: true, count: users.length, users });
});

module.exports = router;
