const router = require('express').Router();
const pool = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate); // every route below requires a valid token

// POST /api/tickets - Create ticket
router.post('/', async (req, res) => {
  const { subject, description, priority } = req.body;
  if (!subject) return res.status(400).json({ error: 'Subject is required' });
  if (!description) return res.status(400).json({ error: 'Description is required' });

  const [result] = await pool.execute(
    'INSERT INTO tickets (user_id, subject, description, priority, status) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, subject.trim(), description.trim(), priority || 'medium', 'open']
  );

  const [ticketRows] = await pool.execute(
    `SELECT t.*, u.name AS customer_name, u.email AS customer_email 
     FROM tickets t 
     INNER JOIN users u ON t.user_id = u.id 
     WHERE t.id = ?`,
    [result.insertId]
  );

  res.status(201).json({
    success: true,
    id: result.insertId,
    ticket: ticketRows[0]
  });
});

// GET /api/tickets/stats/summary - Dashboard stats
router.get('/stats/summary', async (req, res) => {
  const [counts] = await pool.execute(`
    SELECT 
      COUNT(*) AS total,
      COUNT(CASE WHEN status = 'open' THEN 1 END) AS open,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) AS in_progress,
      COUNT(CASE WHEN status = 'resolved' THEN 1 END) AS resolved,
      COUNT(CASE WHEN status = 'closed' THEN 1 END) AS closed,
      COUNT(CASE WHEN priority = 'urgent' AND status != 'closed' THEN 1 END) AS urgent
    FROM tickets
  `);
  res.json({ success: true, stats: counts[0] });
});

// GET /api/tickets/reports/open-with-customers - Requirement 8 SQL JOIN Query
router.get('/reports/open-with-customers', async (req, res) => {
  const sql = `
    SELECT 
      tickets.id AS ticket_id,
      tickets.subject,
      tickets.description,
      tickets.priority,
      tickets.status,
      tickets.created_at,
      users.id AS customer_id,
      users.name AS customer_name,
      users.email AS customer_email
    FROM tickets
    INNER JOIN users ON tickets.user_id = users.id
    WHERE tickets.status = 'open'
    ORDER BY tickets.created_at DESC
  `;
  const [rows] = await pool.execute(sql);
  res.json({ success: true, count: rows.length, tickets: rows });
});

// GET /api/tickets - List tickets (scoped by role)
router.get('/', async (req, res) => {
  const { status, priority, search } = req.query;

  // Base query with joins
  let sql = `
    SELECT 
      t.id,
      t.user_id,
      t.subject,
      t.description,
      t.priority,
      t.status,
      t.assigned_to,
      t.created_at,
      t.updated_at,
      customer.name AS customer_name,
      customer.email AS customer_email,
      agent.name AS assigned_agent_name,
      agent.email AS assigned_agent_email,
      (SELECT COUNT(*) FROM ticket_comments WHERE ticket_id = t.id) AS comment_count
    FROM tickets t
    INNER JOIN users customer ON t.user_id = customer.id
    LEFT JOIN users agent ON t.assigned_to = agent.id
    WHERE 1=1
  `;
  const params = [];

  // agents see everything; customers see only their own tickets
  if (req.user.role !== 'agent') {
    sql += ' AND t.user_id = ?';
    params.push(req.user.id);
  }

  if (status && status !== 'all') {
    sql += ' AND t.status = ?';
    params.push(status);
  }

  if (priority && priority !== 'all') {
    sql += ' AND t.priority = ?';
    params.push(priority);
  }

  if (search && search.trim()) {
    sql += ' AND (t.subject LIKE ? OR t.description LIKE ?)';
    const pattern = `%${search.trim()}%`;
    params.push(pattern, pattern);
  }

  sql += ' ORDER BY t.created_at DESC';

  const [rows] = await pool.execute(sql, params);
  res.json({ success: true, count: rows.length, tickets: rows });
});

// GET /api/tickets/:id - Details with ownership check
router.get('/:id', async (req, res) => {
  const ticketId = parseInt(req.params.id, 10);
  if (isNaN(ticketId)) return res.status(400).json({ error: 'Invalid ticket id' });

  const [rows] = await pool.execute(
    `SELECT 
      t.*,
      customer.name AS customer_name,
      customer.email AS customer_email,
      agent.name AS assigned_agent_name,
      agent.email AS assigned_agent_email
    FROM tickets t
    INNER JOIN users customer ON t.user_id = customer.id
    LEFT JOIN users agent ON t.assigned_to = agent.id
    WHERE t.id = ?`,
    [ticketId]
  );

  if (!rows.length) return res.status(404).json({ error: 'Ticket not found' });
  const ticket = rows[0];

  // Ownership check:
  if (req.user.role !== 'agent' && ticket.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json({ success: true, ticket });
});

// PUT /api/tickets/:id - Update ticket
router.put('/:id', async (req, res) => {
  const ticketId = parseInt(req.params.id, 10);
  if (isNaN(ticketId)) return res.status(400).json({ error: 'Invalid ticket id' });

  const [existing] = await pool.execute('SELECT * FROM tickets WHERE id = ?', [ticketId]);
  if (!existing.length) return res.status(404).json({ error: 'Ticket not found' });
  const ticket = existing[0];

  if (req.user.role !== 'agent' && ticket.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { status, priority, assigned_to } = req.body;
  const updates = [];
  const params = [];

  if (req.user.role === 'agent') {
    if (status) { updates.push('status = ?'); params.push(status); }
    if (priority) { updates.push('priority = ?'); params.push(priority); }
    if (assigned_to !== undefined) {
      if (assigned_to === null || assigned_to === '') {
        updates.push('assigned_to = NULL');
      } else {
        updates.push('assigned_to = ?');
        params.push(assigned_to);
      }
    }
  } else {
    // Customer can close ticket
    if (status === 'closed') {
      updates.push('status = ?');
      params.push('closed');
    }
  }

  if (updates.length > 0) {
    params.push(ticketId);
    await pool.execute(`UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  const [updated] = await pool.execute('SELECT * FROM tickets WHERE id = ?', [ticketId]);
  res.json({ message: 'Ticket updated', ticket: updated[0] });
});

// DELETE /api/tickets/:id
router.delete('/:id', async (req, res) => {
  const ticketId = parseInt(req.params.id, 10);
  if (isNaN(ticketId)) return res.status(400).json({ error: 'Invalid ticket id' });

  const [rows] = await pool.execute('SELECT * FROM tickets WHERE id = ?', [ticketId]);
  if (!rows.length) return res.status(404).json({ error: 'Ticket not found' });

  if (req.user.role !== 'agent' && rows[0].user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await pool.execute('DELETE FROM tickets WHERE id = ?', [ticketId]);
  res.json({ success: true, message: 'Ticket deleted' });
});

// GET /api/tickets/:id/comments
router.get('/:id/comments', async (req, res) => {
  const ticketId = parseInt(req.params.id, 10);
  const [comments] = await pool.execute(
    `SELECT 
      c.id, c.ticket_id, c.comment, c.created_at, 
      u.id AS user_id, u.name AS author_name, u.role AS author_role 
     FROM ticket_comments c 
     INNER JOIN users u ON c.user_id = u.id 
     WHERE c.ticket_id = ? 
     ORDER BY c.created_at ASC`,
    [ticketId]
  );
  res.json({ success: true, count: comments.length, comments });
});

// POST /api/tickets/:id/comments
router.post('/:id/comments', async (req, res) => {
  const ticketId = parseInt(req.params.id, 10);
  const { comment } = req.body;
  if (!comment || !comment.trim()) return res.status(400).json({ error: 'Comment is required' });

  const [result] = await pool.execute(
    'INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES (?, ?, ?)',
    [ticketId, req.user.id, comment.trim()]
  );

  const [newComment] = await pool.execute(
    `SELECT 
      c.id, c.ticket_id, c.comment, c.created_at, 
      u.id AS user_id, u.name AS author_name, u.role AS author_role 
     FROM ticket_comments c 
     INNER JOIN users u ON c.user_id = u.id 
     WHERE c.id = ?`,
    [result.insertId]
  );

  res.status(201).json({ success: true, comment: newComment[0] });
});

module.exports = router;
