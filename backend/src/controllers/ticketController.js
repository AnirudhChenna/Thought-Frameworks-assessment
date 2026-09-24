const { pool } = require('../config/db');

// GET /api/tickets
// Authenticated. Role-based:
// - Customers get only their own tickets
// - Agents get all tickets
// Supports search, status filter, priority filter, sorting
const getTickets = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    const { status, priority, search, sortBy, sortOrder } = req.query;

    let query = `
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

    // Role-based scoping: customer can only see own tickets
    if (role === 'customer') {
      query += ` AND t.user_id = ?`;
      params.push(userId);
    }

    // Filter by status
    if (status && status !== 'all') {
      query += ` AND t.status = ?`;
      params.push(status);
    }

    // Filter by priority
    if (priority && priority !== 'all') {
      query += ` AND t.priority = ?`;
      params.push(priority);
    }

    // Keyword search in subject or description
    if (search && search.trim() !== '') {
      query += ` AND (t.subject LIKE ? OR t.description LIKE ?)`;
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern);
    }

    // Sorting
    const allowedSortFields = ['created_at', 'updated_at', 'priority', 'status', 'id'];
    const sortField = allowedSortFields.includes(sortBy) ? `t.${sortBy}` : 't.created_at';
    const order = (sortOrder && sortOrder.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

    query += ` ORDER BY ${sortField} ${order}`;

    const [tickets] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: tickets.length,
      tickets
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tickets/:id
// Authorized user:
// - Customer can only access their own ticket
// - Agent can access any ticket
const getTicketById = async (req, res, next) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ticket ID provided.'
      });
    }

    const { role, id: userId } = req.user;

    const query = `
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
        agent.email AS assigned_agent_email
      FROM tickets t
      INNER JOIN users customer ON t.user_id = customer.id
      LEFT JOIN users agent ON t.assigned_to = agent.id
      WHERE t.id = ?
    `;

    const [rows] = await pool.query(query, [ticketId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Ticket with ID #${ticketId} was not found.`
      });
    }

    const ticket = rows[0];

    // Authorization check: Customer can only view their own ticket
    if (role === 'customer' && ticket.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have permission to view this ticket.'
      });
    }

    return res.status(200).json({
      success: true,
      ticket
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/tickets
// Customer: Create ticket with subject, description, priority
const createTicket = async (req, res, next) => {
  try {
    const { subject, description, priority } = req.body;
    const userId = req.user.id;

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Ticket subject is required.'
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Ticket description is required.'
      });
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const ticketPriority = validPriorities.includes(priority) ? priority : 'medium';

    const insertQuery = `
      INSERT INTO tickets (user_id, subject, description, priority, status)
      VALUES (?, ?, ?, ?, 'open')
    `;

    const [result] = await pool.query(insertQuery, [
      userId,
      subject.trim(),
      description.trim(),
      ticketPriority
    ]);

    // Fetch the newly created ticket with joined details
    const [rows] = await pool.query(
      `SELECT t.*, u.name AS customer_name, u.email AS customer_email 
       FROM tickets t 
       INNER JOIN users u ON t.user_id = u.id 
       WHERE t.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Support ticket created successfully.',
      ticket: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/tickets/:id
// Update ticket details, status, priority, or assignment
// - Support Agent can update status, priority, and assign_to
// - Customer can update subject/description or close their own ticket
const updateTicket = async (req, res, next) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ticket ID provided.'
      });
    }

    const { role, id: userId } = req.user;
    const { status, priority, assigned_to, subject, description } = req.body;

    // Check if ticket exists
    const [existing] = await pool.query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Ticket #${ticketId} not found.`
      });
    }

    const ticket = existing[0];

    // Authorization checks
    if (role === 'customer' && ticket.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You cannot modify tickets belonging to other customers.'
      });
    }

    const updates = [];
    const params = [];

    if (role === 'agent') {
      // Agents can change status, priority, assigned_to
      if (status !== undefined) {
        const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
          });
        }
        updates.push('status = ?');
        params.push(status);
      }

      if (priority !== undefined) {
        const validPriorities = ['low', 'medium', 'high', 'urgent'];
        if (!validPriorities.includes(priority)) {
          return res.status(400).json({
            success: false,
            error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`
          });
        }
        updates.push('priority = ?');
        params.push(priority);
      }

      if (assigned_to !== undefined) {
        if (assigned_to === null || assigned_to === '') {
          updates.push('assigned_to = NULL');
        } else {
          // Verify agent exists
          const [agentCheck] = await pool.query(
            'SELECT id FROM users WHERE id = ? AND role = "agent"',
            [assigned_to]
          );
          if (agentCheck.length === 0) {
            return res.status(400).json({
              success: false,
              error: 'Invalid assigned_to ID. Must be an active support agent.'
            });
          }
          updates.push('assigned_to = ?');
          params.push(assigned_to);
        }
      }

      if (subject !== undefined && subject.trim()) {
        updates.push('subject = ?');
        params.push(subject.trim());
      }

      if (description !== undefined && description.trim()) {
        updates.push('description = ?');
        params.push(description.trim());
      }
    } else if (role === 'customer') {
      // Customer can update subject/description if ticket is not closed
      if (ticket.status === 'closed') {
        return res.status(400).json({
          success: false,
          error: 'Closed tickets cannot be modified. Please open a new ticket.'
        });
      }

      if (subject !== undefined && subject.trim()) {
        updates.push('subject = ?');
        params.push(subject.trim());
      }

      if (description !== undefined && description.trim()) {
        updates.push('description = ?');
        params.push(description.trim());
      }

      // Customer may also close their ticket if resolved
      if (status !== undefined) {
        if (status === 'closed') {
          updates.push('status = ?');
          params.push('closed');
        } else {
          return res.status(403).json({
            success: false,
            error: 'Customers are only permitted to close their own tickets.'
          });
        }
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields provided for update.'
      });
    }

    const updateQuery = `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`;
    params.push(ticketId);

    await pool.query(updateQuery, params);

    // Fetch updated ticket with join
    const [updatedRows] = await pool.query(
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

    return res.status(200).json({
      success: true,
      message: 'Ticket updated successfully.',
      ticket: updatedRows[0]
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/tickets/:id
// Customers can delete their own open tickets; Agents can delete any ticket
const deleteTicket = async (req, res, next) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ticket ID provided.'
      });
    }

    const { role, id: userId } = req.user;

    const [rows] = await pool.query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Ticket #${ticketId} not found.`
      });
    }

    const ticket = rows[0];

    // Customer can only delete their own ticket
    if (role === 'customer' && ticket.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You cannot delete tickets belonging to other users.'
      });
    }

    await pool.query('DELETE FROM tickets WHERE id = ?', [ticketId]);

    return res.status(200).json({
      success: true,
      message: `Ticket #${ticketId} deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tickets/stats/summary
// Agent dashboard statistics
const getTicketStats = async (req, res, next) => {
  try {
    const [counts] = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        COUNT(CASE WHEN status = 'open' THEN 1 END) AS open,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) AS in_progress,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) AS resolved,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) AS closed,
        COUNT(CASE WHEN priority = 'urgent' AND status != 'closed' THEN 1 END) AS urgent,
        COUNT(CASE WHEN priority = 'high' AND status != 'closed' THEN 1 END) AS high_priority,
        COUNT(CASE WHEN assigned_to IS NULL AND status != 'closed' THEN 1 END) AS unassigned
      FROM tickets
    `);

    // Priority breakdown
    const [priorities] = await pool.query(`
      SELECT priority, COUNT(*) AS count
      FROM tickets
      GROUP BY priority
    `);

    return res.status(200).json({
      success: true,
      stats: counts[0],
      priorities
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tickets/reports/open-with-customers
// Section 8 Requirement: Returns all open tickets along with customer's name and email
// Demonstrates INNER JOIN and filtering
const getOpenTicketsWithCustomers = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        t.id AS ticket_id,
        t.subject,
        t.description,
        t.priority,
        t.status,
        t.created_at,
        u.id AS customer_id,
        u.name AS customer_name,
        u.email AS customer_email
      FROM tickets t
      INNER JOIN users u ON t.user_id = u.id
      WHERE t.status = 'open'
      ORDER BY t.created_at DESC
    `;

    const [results] = await pool.query(query);

    return res.status(200).json({
      success: true,
      count: results.length,
      tickets: results
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketStats,
  getOpenTicketsWithCustomers
};
