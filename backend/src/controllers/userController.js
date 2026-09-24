const { pool } = require('../config/db');

// GET /api/users
// Fetch users (support agents, customers). Accessible by Agent role
const getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;

    let query = `
      SELECT 
        id, 
        name, 
        email, 
        role, 
        created_at 
      FROM users
    `;
    const params = [];

    if (role && (role === 'agent' || role === 'customer')) {
      query += ` WHERE role = ?`;
      params.push(role);
    }

    query += ` ORDER BY name ASC`;

    const [users] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers
};
