const express = require('express');
const { body, param } = require('express-validator');
const {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketStats,
  getOpenTicketsWithCustomers
} = require('../controllers/ticketController');
const {
  getComments,
  addComment
} = require('../controllers/commentController');
const { verifyToken, requireAgent } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');

const router = express.Router();

// All ticket routes require authentication
router.use(verifyToken);

// Agent-only dashboard metrics and requirement 8 reports
router.get('/stats/summary', requireAgent, getTicketStats);
router.get('/reports/open-with-customers', requireAgent, getOpenTicketsWithCustomers);

// Ticket list: GET /api/tickets
router.get('/', getTickets);

// Ticket creation: POST /api/tickets
router.post(
  '/',
  [
    body('subject')
      .trim()
      .notEmpty()
      .withMessage('Subject is required.')
      .isLength({ max: 255 })
      .withMessage('Subject cannot exceed 255 characters.'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required.'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Priority must be one of: low, medium, high, urgent.'),
    handleValidationErrors
  ],
  createTicket
);

// Ticket details: GET /api/tickets/:id
router.get('/:id', getTicketById);

// Update ticket: PUT /api/tickets/:id
router.put('/:id', updateTicket);

// Delete ticket: DELETE /api/tickets/:id
router.delete('/:id', deleteTicket);

// Ticket Comments: GET /api/tickets/:id/comments
router.get('/:id/comments', getComments);

// Add Comment: POST /api/tickets/:id/comments
router.post(
  '/:id/comments',
  [
    body('comment')
      .trim()
      .notEmpty()
      .withMessage('Comment text cannot be empty.'),
    handleValidationErrors
  ],
  addComment
);

module.exports = router;
