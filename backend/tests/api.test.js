const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock database pool before importing app
jest.mock('../src/config/db', () => {
  return {
    pool: {
      query: jest.fn()
    },
    testConnection: jest.fn().mockResolvedValue(true)
  };
});

const { pool } = require('../src/config/db');
const app = require('../src/app');

describe('Support Ticket System - Comprehensive REST API Test Suite', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'support_ticket_jwt_secret_token_key_change_in_production_2026';

  // Helper tokens
  const customerToken = jwt.sign(
    { id: 1, name: 'Alice Customer', email: 'alice@example.com', role: 'customer' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const anotherCustomerToken = jwt.sign(
    { id: 2, name: 'Bob Customer', email: 'bob@example.com', role: 'customer' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const agentToken = jwt.sign(
    { id: 4, name: 'David Agent', email: 'david.agent@example.com', role: 'agent' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------
  // 1. Authentication Tests
  // -------------------------------------------------------------
  describe('Authentication APIs', () => {
    test('1. Valid customer registration succeeds (201)', async () => {
      // Mock check existing email -> returns empty
      pool.query
        .mockResolvedValueOnce([[]]) // SELECT id FROM users WHERE email = ?
        .mockResolvedValueOnce([{ insertId: 10 }]); // INSERT INTO users

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New Customer',
          email: 'newcustomer@example.com',
          password: 'Password123!'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('newcustomer@example.com');
      expect(res.body.user.role).toBe('customer');
    });

    test('2. Registration with duplicate email is rejected (409)', async () => {
      pool.query.mockResolvedValueOnce([[{ id: 1 }]]); // existing user found

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Alice',
          email: 'alice@example.com',
          password: 'Password123!'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/already exists/i);
    });

    test('3. Registration with invalid payload is rejected (400)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: '',
          email: 'invalid-email',
          password: '123' // too short
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('4. Valid login succeeds with correct credentials (200)', async () => {
      const hashedPassword = bcrypt.hashSync('Password123!', 10);
      pool.query.mockResolvedValueOnce([
        [
          {
            id: 1,
            name: 'Alice Johnson',
            email: 'alice@example.com',
            password_hash: hashedPassword,
            role: 'customer',
            created_at: new Date()
          }
        ]
      ]);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'Password123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.name).toBe('Alice Johnson');
    });

    test('5. Invalid password is rejected (401)', async () => {
      const hashedPassword = bcrypt.hashSync('Password123!', 10);
      pool.query.mockResolvedValueOnce([
        [
          {
            id: 1,
            name: 'Alice Johnson',
            email: 'alice@example.com',
            password_hash: hashedPassword,
            role: 'customer'
          }
        ]
      ]);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'WrongPassword999!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/invalid email or password/i);
    });
  });

  // -------------------------------------------------------------
  // 2. Authorization & Security Tests
  // -------------------------------------------------------------
  describe('Security & Authorization', () => {
    test('6. Unauthorized request without token is rejected (401)', async () => {
      const res = await request(app).get('/api/tickets');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/authentication required/i);
    });

    test('7. Customer cannot access another customer ticket (403)', async () => {
      // Ticket 1 belongs to user_id 1. Bob has user_id 2.
      pool.query.mockResolvedValueOnce([
        [
          {
            id: 1,
            user_id: 1, // belongs to Alice
            subject: 'Secret Ticket',
            description: 'Customer data',
            priority: 'medium',
            status: 'open'
          }
        ]
      ]);

      const res = await request(app)
        .get('/api/tickets/1')
        .set('Authorization', `Bearer ${anotherCustomerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/access denied/i);
    });

    test('8. Customer cannot access agent-only endpoints (403)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/access denied/i);
    });
  });

  // -------------------------------------------------------------
  // 3. Ticket Lifecycle & Management Tests
  // -------------------------------------------------------------
  describe('Ticket Operations', () => {
    test('9. Ticket creation succeeds for customer (201)', async () => {
      pool.query
        .mockResolvedValueOnce([{ insertId: 42 }]) // INSERT INTO tickets
        .mockResolvedValueOnce([
          [
            {
              id: 42,
              user_id: 1,
              subject: 'Database connection issue',
              description: 'Cannot connect to replica node',
              priority: 'high',
              status: 'open',
              customer_name: 'Alice Customer',
              customer_email: 'alice@example.com'
            }
          ]
        ]); // SELECT joined ticket

      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          subject: 'Database connection issue',
          description: 'Cannot connect to replica node',
          priority: 'high'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.ticket.id).toBe(42);
      expect(res.body.ticket.subject).toBe('Database connection issue');
    });

    test('10. Invalid ticket ID returns 400', async () => {
      const res = await request(app)
        .get('/api/tickets/not-a-number')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/invalid ticket id/i);
    });

    test('11. Non-existent ticket returns 404', async () => {
      pool.query.mockResolvedValueOnce([[]]); // No rows found

      const res = await request(app)
        .get('/api/tickets/999999')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/not found/i);
    });

    test('12. Support agent can update ticket status and assignment (200)', async () => {
      pool.query
        .mockResolvedValueOnce([[{ id: 1, user_id: 1, status: 'open' }]]) // existing check
        .mockResolvedValueOnce([[{ id: 4 }]]) // agentCheck
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE
        .mockResolvedValueOnce([
          [
            {
              id: 1,
              user_id: 1,
              status: 'in_progress',
              priority: 'urgent',
              assigned_to: 4,
              assigned_agent_name: 'David Agent'
            }
          ]
        ]); // updated select

      const res = await request(app)
        .put('/api/tickets/1')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          status: 'in_progress',
          priority: 'urgent',
          assigned_to: 4
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.ticket.status).toBe('in_progress');
    });

    test('13. Adding a comment to a ticket succeeds (201)', async () => {
      pool.query
        .mockResolvedValueOnce([[{ id: 1, user_id: 1, status: 'open' }]]) // ticket check
        .mockResolvedValueOnce([{ insertId: 101 }]) // INSERT comment
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE ticket updated_at
        .mockResolvedValueOnce([
          [
            {
              id: 101,
              ticket_id: 1,
              comment: 'Investigating gateway logs now.',
              user_id: 4,
              author_name: 'David Agent',
              author_role: 'agent',
              created_at: new Date()
            }
          ]
        ]); // SELECT new comment

      const res = await request(app)
        .post('/api/tickets/1/comments')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          comment: 'Investigating gateway logs now.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.comment.comment).toBe('Investigating gateway logs now.');
    });
  });
});
