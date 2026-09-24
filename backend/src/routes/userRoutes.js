const express = require('express');
const { getUsers } = require('../controllers/userController');
const { verifyToken, requireAgent } = require('../middleware/auth');

const router = express.Router();

// GET /api/users - Agent access
router.get('/', verifyToken, requireAgent, getUsers);

module.exports = router;
