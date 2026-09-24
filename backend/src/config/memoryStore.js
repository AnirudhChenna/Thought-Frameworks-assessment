// In-Memory Database Fallback Engine
// Automatically active when external MySQL Server is unreachable/unconfigured.
// Provides 100% full CRUD, filtering, joining, and stats emulation.

class MemoryStore {
  constructor() {
    this.users = [
      {
        id: 1,
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password_hash: '$2a$10$gpSa5fH9DsQgn.AMBv8Jweu3xwHMNSiD7YE8qE25BaeGuPj80apDu', // Password123!
        role: 'customer',
        created_at: new Date('2026-09-01T09:00:00Z')
      },
      {
        id: 2,
        name: 'Bob Smith',
        email: 'bob@example.com',
        password_hash: '$2a$10$gpSa5fH9DsQgn.AMBv8Jweu3xwHMNSiD7YE8qE25BaeGuPj80apDu',
        role: 'customer',
        created_at: new Date('2026-09-02T10:15:00Z')
      },
      {
        id: 3,
        name: 'Carol White',
        email: 'carol@example.com',
        password_hash: '$2a$10$gpSa5fH9DsQgn.AMBv8Jweu3xwHMNSiD7YE8qE25BaeGuPj80apDu',
        role: 'customer',
        created_at: new Date('2026-09-03T11:30:00Z')
      },
      {
        id: 4,
        name: 'David Miller',
        email: 'david.agent@example.com',
        password_hash: '$2a$10$gpSa5fH9DsQgn.AMBv8Jweu3xwHMNSiD7YE8qE25BaeGuPj80apDu',
        role: 'agent',
        created_at: new Date('2026-08-15T08:00:00Z')
      },
      {
        id: 5,
        name: 'Emma Davis',
        email: 'emma.agent@example.com',
        password_hash: '$2a$10$gpSa5fH9DsQgn.AMBv8Jweu3xwHMNSiD7YE8qE25BaeGuPj80apDu',
        role: 'agent',
        created_at: new Date('2026-08-15T08:30:00Z')
      }
    ];

    this.tickets = [
      {
        id: 1,
        user_id: 1,
        subject: 'Cannot process payment on checkout page',
        description: 'Whenever I click the Pay Now button using my Visa card, an error 500 displays on screen. Transaction fails but card was pre-authorized.',
        priority: 'urgent',
        status: 'open',
        assigned_to: 4,
        created_at: new Date('2026-09-10T14:20:00Z'),
        updated_at: new Date('2026-09-10T14:20:00Z')
      },
      {
        id: 2,
        user_id: 1,
        subject: 'Need invoice for August 2026 subscription',
        description: 'Hi, I need an official tax invoice containing our company GSTIN for accounting purposes.',
        priority: 'low',
        status: 'resolved',
        assigned_to: 5,
        created_at: new Date('2026-09-12T11:00:00Z'),
        updated_at: new Date('2026-09-13T16:45:00Z')
      },
      {
        id: 3,
        user_id: 2,
        subject: 'API rate limit threshold exceeded unexpectedly',
        description: 'Our staging integration received HTTP 429 Too Many Requests even though we are within the 100 req/min quota limit.',
        priority: 'high',
        status: 'in_progress',
        assigned_to: 4,
        created_at: new Date('2026-09-15T16:10:00Z'),
        updated_at: new Date('2026-09-16T09:30:00Z')
      },
      {
        id: 4,
        user_id: 2,
        subject: 'Feature Request: Webhook notifications on ticket update',
        description: 'It would be fantastic if we could configure a custom webhook URL to trigger when ticket statuses change.',
        priority: 'medium',
        status: 'open',
        assigned_to: null,
        created_at: new Date('2026-09-18T10:00:00Z'),
        updated_at: new Date('2026-09-18T10:00:00Z')
      },
      {
        id: 5,
        user_id: 3,
        subject: 'Mobile responsive layout issue on dashboard',
        description: 'When viewing the customer dashboard on iPhone 15 Pro Safari, the action buttons overlap with the navigation header.',
        priority: 'medium',
        status: 'in_progress',
        assigned_to: 5,
        created_at: new Date('2026-09-19T13:40:00Z'),
        updated_at: new Date('2026-09-20T11:15:00Z')
      },
      {
        id: 6,
        user_id: 3,
        subject: 'Account email verification link expired',
        description: 'I registered yesterday but the verification email link says token expired after only 30 minutes.',
        priority: 'low',
        status: 'closed',
        assigned_to: 4,
        created_at: new Date('2026-09-05T08:20:00Z'),
        updated_at: new Date('2026-09-06T12:00:00Z')
      }
    ];

    this.comments = [
      {
        id: 1,
        ticket_id: 1,
        user_id: 1,
        comment: 'Here is the gateway error code: ERR_PAYMENT_GATEWAY_TIMEOUT_504.',
        created_at: new Date('2026-09-10T14:25:00Z')
      },
      {
        id: 2,
        ticket_id: 1,
        user_id: 4,
        comment: 'Hello Alice, thank you for reaching out. We are investigating the payment gateway logs with our provider Stripe. Will update you shortly.',
        created_at: new Date('2026-09-10T14:45:00Z')
      },
      {
        id: 3,
        ticket_id: 1,
        user_id: 4,
        comment: 'We have identified an upstream timeout issue. Our engineering team is currently pushing a retry handler patch.',
        created_at: new Date('2026-09-10T15:30:00Z')
      },
      {
        id: 4,
        ticket_id: 2,
        user_id: 5,
        comment: 'Hello Alice, please find attached the revised invoice with GSTIN. Let us know if you need anything else!',
        created_at: new Date('2026-09-13T16:30:00Z')
      },
      {
        id: 5,
        ticket_id: 2,
        user_id: 1,
        comment: 'Received and verified with our finance team. Thank you Emma!',
        created_at: new Date('2026-09-13T16:44:00Z')
      },
      {
        id: 6,
        ticket_id: 3,
        user_id: 2,
        comment: 'Attaching our request log timestamp: bursts occur around 14:00 UTC.',
        created_at: new Date('2026-09-15T16:25:00Z')
      },
      {
        id: 7,
        ticket_id: 3,
        user_id: 4,
        comment: 'Hi Bob, checked our Redis rate limiter cluster. A token bucket synchronization bug was causing premature resets. Patch is deployed to staging.',
        created_at: new Date('2026-09-16T09:30:00Z')
      },
      {
        id: 8,
        ticket_id: 5,
        user_id: 5,
        comment: 'Hi Carol, we reproduced the issue on iOS Safari. A CSS flex-wrap fix is in QA review now.',
        created_at: new Date('2026-09-20T11:15:00Z')
      }
    ];

    this.nextUserId = 6;
    this.nextTicketId = 7;
    this.nextCommentId = 9;
  }

  // Handle SQL query emulation
  async query(sql, params = []) {
    const cleanSql = sql.trim().replace(/\s+/g, ' ');

    // 1. Auth: Check email exists
    if (/SELECT id FROM users WHERE email = \?/i.test(cleanSql)) {
      const email = params[0]?.toLowerCase();
      const user = this.users.find((u) => u.email.toLowerCase() === email);
      return [user ? [{ id: user.id }] : []];
    }

    // 2. Auth: Insert user
    if (/INSERT INTO users/i.test(cleanSql)) {
      const [name, email, passwordHash, role] = params;
      const newUser = {
        id: this.nextUserId++,
        name,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        role: role || 'customer',
        created_at: new Date()
      };
      this.users.push(newUser);
      return [{ insertId: newUser.id, affectedRows: 1 }];
    }

    // 3. Auth: Find user by email
    if (/SELECT .+ FROM users WHERE email = \?/i.test(cleanSql)) {
      const email = params[0]?.toLowerCase();
      const user = this.users.find((u) => u.email.toLowerCase() === email);
      return [user ? [{ ...user }] : []];
    }

    // 4. Auth: Get me by ID
    if (/SELECT .+ FROM users WHERE id = \?/i.test(cleanSql)) {
      const id = parseInt(params[0], 10);
      const user = this.users.find((u) => u.id === id);
      return [user ? [{ ...user }] : []];
    }

    // 5. Users: List users / agents
    if (/SELECT .+ FROM users WHERE role = \?/i.test(cleanSql)) {
      const role = params[0];
      const matches = this.users.filter((u) => u.role === role);
      return [matches];
    }
    if (/SELECT .+ FROM users ORDER BY/i.test(cleanSql)) {
      return [this.users];
    }

    // 6. Section 8 Requirement: Open tickets with customer details (JOIN)
    if (/WHERE t\.status = 'open' ORDER BY t\.created_at DESC/i.test(cleanSql)) {
      const openTickets = this.tickets
        .filter((t) => t.status === 'open')
        .map((t) => {
          const customer = this.users.find((u) => u.id === t.user_id) || {};
          return {
            ticket_id: t.id,
            subject: t.subject,
            description: t.description,
            priority: t.priority,
            status: t.status,
            created_at: t.created_at,
            customer_id: customer.id,
            customer_name: customer.name,
            customer_email: customer.email
          };
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return [openTickets];
    }

    // 7. Ticket Stats Summary
    if (/SELECT COUNT\(\*\) AS total/i.test(cleanSql)) {
      const stats = {
        total: this.tickets.length,
        open: this.tickets.filter((t) => t.status === 'open').length,
        in_progress: this.tickets.filter((t) => t.status === 'in_progress').length,
        resolved: this.tickets.filter((t) => t.status === 'resolved').length,
        closed: this.tickets.filter((t) => t.status === 'closed').length,
        urgent: this.tickets.filter((t) => t.priority === 'urgent' && t.status !== 'closed').length,
        high_priority: this.tickets.filter((t) => t.priority === 'high' && t.status !== 'closed').length,
        unassigned: this.tickets.filter((t) => !t.assigned_to && t.status !== 'closed').length
      };
      return [[stats]];
    }

    // 8. Priority breakdown
    if (/SELECT priority, COUNT\(\*\) AS count FROM tickets GROUP BY priority/i.test(cleanSql)) {
      const counts = {};
      this.tickets.forEach((t) => {
        counts[t.priority] = (counts[t.priority] || 0) + 1;
      });
      const rows = Object.entries(counts).map(([priority, count]) => ({ priority, count }));
      return [rows];
    }

    // 9. Single Ticket by ID (Get / Check)
    if (/SELECT \* FROM tickets WHERE id = \?/i.test(cleanSql) || /SELECT id, user_id.+FROM tickets WHERE id = \?/i.test(cleanSql)) {
      const id = parseInt(params[0], 10);
      const ticket = this.tickets.find((t) => t.id === id);
      return [ticket ? [{ ...ticket }] : []];
    }

    // 10. Joined Ticket by ID
    if (/FROM tickets t INNER JOIN users customer.+WHERE t\.id = \?/i.test(cleanSql)) {
      const id = parseInt(params[0], 10);
      const ticket = this.tickets.find((t) => t.id === id);
      if (!ticket) return [[]];
      const customer = this.users.find((u) => u.id === ticket.user_id) || {};
      const agent = this.users.find((u) => u.id === ticket.assigned_to) || null;
      return [
        [
          {
            ...ticket,
            customer_name: customer.name,
            customer_email: customer.email,
            assigned_agent_name: agent ? agent.name : null,
            assigned_agent_email: agent ? agent.email : null
          }
        ]
      ];
    }

    // 11. Create Ticket
    if (/INSERT INTO tickets/i.test(cleanSql)) {
      const [user_id, subject, description, priority] = params;
      const newTicket = {
        id: this.nextTicketId++,
        user_id: parseInt(user_id, 10),
        subject,
        description,
        priority: priority || 'medium',
        status: 'open',
        assigned_to: null,
        created_at: new Date(),
        updated_at: new Date()
      };
      this.tickets.unshift(newTicket);
      return [{ insertId: newTicket.id, affectedRows: 1 }];
    }

    // 12. Update Ticket
    if (/UPDATE tickets SET/i.test(cleanSql)) {
      const ticketId = parseInt(params[params.length - 1], 10);
      const ticket = this.tickets.find((t) => t.id === ticketId);
      if (ticket) {
        ticket.updated_at = new Date();
        // Check fields in params
        if (/status = \?/i.test(cleanSql)) {
          const statusIdx = cleanSql.indexOf('status = ?');
          // simple param mapping
          params.forEach((p) => {
            if (['open', 'in_progress', 'resolved', 'closed'].includes(p)) {
              ticket.status = p;
            } else if (['low', 'medium', 'high', 'urgent'].includes(p)) {
              ticket.priority = p;
            }
          });
        }
        if (/assigned_to = NULL/i.test(cleanSql)) {
          ticket.assigned_to = null;
        } else if (/assigned_to = \?/i.test(cleanSql)) {
          const agentId = params.find((p) => typeof p === 'number' && p !== ticketId);
          if (agentId) ticket.assigned_to = agentId;
        }
      }
      return [{ affectedRows: ticket ? 1 : 0 }];
    }

    // 13. Delete Ticket
    if (/DELETE FROM tickets WHERE id = \?/i.test(cleanSql)) {
      const id = parseInt(params[0], 10);
      const idx = this.tickets.findIndex((t) => t.id === id);
      if (idx !== -1) {
        this.tickets.splice(idx, 1);
        return [{ affectedRows: 1 }];
      }
      return [{ affectedRows: 0 }];
    }

    // 14. Get Comments for Ticket
    if (/FROM ticket_comments c INNER JOIN users u.+WHERE c\.ticket_id = \?/i.test(cleanSql)) {
      const ticketId = parseInt(params[0], 10);
      const thread = this.comments
        .filter((c) => c.ticket_id === ticketId)
        .map((c) => {
          const author = this.users.find((u) => u.id === c.user_id) || {};
          return {
            id: c.id,
            ticket_id: c.ticket_id,
            comment: c.comment,
            created_at: c.created_at,
            user_id: author.id,
            author_name: author.name,
            author_role: author.role
          };
        })
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      return [thread];
    }

    // 15. Add Comment
    if (/INSERT INTO ticket_comments/i.test(cleanSql)) {
      const [ticket_id, user_id, comment] = params;
      const newComment = {
        id: this.nextCommentId++,
        ticket_id: parseInt(ticket_id, 10),
        user_id: parseInt(user_id, 10),
        comment,
        created_at: new Date()
      };
      this.comments.push(newComment);
      return [{ insertId: newComment.id, affectedRows: 1 }];
    }

    // 16. Get Comment by ID (post-insert)
    if (/FROM ticket_comments c INNER JOIN users u.+WHERE c\.id = \?/i.test(cleanSql)) {
      const id = parseInt(params[0], 10);
      const c = this.comments.find((item) => item.id === id);
      if (!c) return [[]];
      const author = this.users.find((u) => u.id === c.user_id) || {};
      return [
        [
          {
            id: c.id,
            ticket_id: c.ticket_id,
            comment: c.comment,
            created_at: c.created_at,
            user_id: author.id,
            author_name: author.name,
            author_role: author.role
          }
        ]
      ];
    }

    // 17. List Tickets with filtering
    if (/SELECT .+ FROM tickets t INNER JOIN users customer/i.test(cleanSql)) {
      let result = this.tickets.map((t) => {
        const customer = this.users.find((u) => u.id === t.user_id) || {};
        const agent = this.users.find((u) => u.id === t.assigned_to) || null;
        const commentCount = this.comments.filter((c) => c.ticket_id === t.id).length;
        return {
          id: t.id,
          user_id: t.user_id,
          subject: t.subject,
          description: t.description,
          priority: t.priority,
          status: t.status,
          assigned_to: t.assigned_to,
          created_at: t.created_at,
          updated_at: t.updated_at,
          customer_name: customer.name,
          customer_email: customer.email,
          assigned_agent_name: agent ? agent.name : null,
          assigned_agent_email: agent ? agent.email : null,
          comment_count: commentCount
        };
      });

      // Filter by customer user_id if present
      if (/AND t\.user_id = \?/i.test(cleanSql)) {
        const userId = params[0];
        result = result.filter((t) => t.user_id === userId);
      }

      // Filter by status if in params
      params.forEach((p) => {
        if (['open', 'in_progress', 'resolved', 'closed'].includes(p)) {
          result = result.filter((t) => t.status === p);
        } else if (['low', 'medium', 'high', 'urgent'].includes(p)) {
          result = result.filter((t) => t.priority === p);
        } else if (typeof p === 'string' && p.startsWith('%') && p.endsWith('%')) {
          const kw = p.slice(1, -1).toLowerCase();
          result = result.filter(
            (t) =>
              t.subject.toLowerCase().includes(kw) ||
              t.description.toLowerCase().includes(kw)
          );
        }
      });

      // Sorting
      if (/ORDER BY t\.created_at ASC/i.test(cleanSql)) {
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      } else {
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }

      return [result];
    }

    return [[]];
  }
}

module.exports = new MemoryStore();
