const { pool } = require('../config/db');

// GET /api/tickets/:id/comments
// Fetch all comments/responses for a ticket
const getComments = async (req, res, next) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ticket ID.'
      });
    }

    const { role, id: userId } = req.user;

    // Check ticket existence and ownership
    const [ticketRows] = await pool.query('SELECT id, user_id FROM tickets WHERE id = ?', [ticketId]);
    if (ticketRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Ticket #${ticketId} not found.`
      });
    }

    const ticket = ticketRows[0];

    // Authorization check: Customer cannot view comments on another customer's ticket
    if (role === 'customer' && ticket.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have permission to view comments for this ticket.'
      });
    }

    const commentsQuery = `
      SELECT 
        c.id,
        c.ticket_id,
        c.comment,
        c.created_at,
        u.id AS user_id,
        u.name AS author_name,
        u.role AS author_role
      FROM ticket_comments c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = ?
      ORDER BY c.created_at ASC
    `;

    const [comments] = await pool.query(commentsQuery, [ticketId]);

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/tickets/:id/comments
// Add a comment/response to a ticket
const addComment = async (req, res, next) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ticket ID.'
      });
    }

    const { comment } = req.body;
    const { role, id: userId } = req.user;

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Comment text is required.'
      });
    }

    // Check if ticket exists
    const [ticketRows] = await pool.query('SELECT id, user_id, status FROM tickets WHERE id = ?', [ticketId]);
    if (ticketRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Ticket #${ticketId} not found.`
      });
    }

    const ticket = ticketRows[0];

    // Authorization check: Customer cannot comment on someone else's ticket
    if (role === 'customer' && ticket.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You cannot comment on a ticket that does not belong to you.'
      });
    }

    // Insert comment
    const [insertResult] = await pool.query(
      'INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES (?, ?, ?)',
      [ticketId, userId, comment.trim()]
    );

    // If customer replied on resolved ticket, or agent replied, update updated_at
    await pool.query('UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [ticketId]);

    // Fetch comment with author info
    const [newCommentRows] = await pool.query(
      `SELECT 
        c.id,
        c.ticket_id,
        c.comment,
        c.created_at,
        u.id AS user_id,
        u.name AS author_name,
        u.role AS author_role
       FROM ticket_comments c
       INNER JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [insertResult.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
      comment: newCommentRows[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getComments,
  addComment
};
