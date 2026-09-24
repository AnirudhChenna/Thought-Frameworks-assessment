-- =====================================================================
-- Support Ticket Management System - SQL Queries
-- Demonstrating JOINs, Filtering, Aggregations, and Performance Indexes
-- =====================================================================

USE `support_tickets`;

-- =====================================================================
-- Requirement 8: Query to return all open tickets along with customer's
-- name and email (Demonstrating INNER JOIN and WHERE filtering)
-- =====================================================================
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
ORDER BY t.created_at DESC;

-- =====================================================================
-- Additional Query 1: Get Ticket Details with Customer & Assigned Agent
-- (Demonstrates LEFT JOIN for optional assigned_to relation)
-- =====================================================================
SELECT 
    t.id AS ticket_id,
    t.subject,
    t.description,
    t.priority,
    t.status,
    t.created_at,
    t.updated_at,
    customer.id AS customer_id,
    customer.name AS customer_name,
    customer.email AS customer_email,
    agent.id AS agent_id,
    agent.name AS agent_name,
    agent.email AS agent_email
FROM tickets t
INNER JOIN users customer ON t.user_id = customer.id
LEFT JOIN users agent ON t.assigned_to = agent.id
WHERE t.id = 1;

-- =====================================================================
-- Additional Query 2: Get Full Comment Thread for a Ticket
-- (Demonstrates INNER JOIN to fetch author information and role)
-- =====================================================================
SELECT 
    c.id AS comment_id,
    c.ticket_id,
    c.comment,
    c.created_at,
    u.id AS user_id,
    u.name AS author_name,
    u.role AS author_role
FROM ticket_comments c
INNER JOIN users u ON c.user_id = u.id
WHERE c.ticket_id = 1
ORDER BY c.created_at ASC;

-- =====================================================================
-- Additional Query 3: Agent Dashboard Statistics & Aggregations
-- (Demonstrates conditional aggregation with CASE WHEN and COUNT)
-- =====================================================================
SELECT 
    COUNT(*) AS total_tickets,
    COUNT(CASE WHEN status = 'open' THEN 1 END) AS open_tickets,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) AS in_progress_tickets,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) AS resolved_tickets,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) AS closed_tickets,
    COUNT(CASE WHEN priority = 'urgent' AND status != 'closed' THEN 1 END) AS urgent_tickets
FROM tickets;

-- =====================================================================
-- Additional Query 4: Agent Workload Distribution
-- (Demonstrates LEFT JOIN, GROUP BY, and COUNT)
-- =====================================================================
SELECT 
    u.id AS agent_id,
    u.name AS agent_name,
    u.email AS agent_email,
    COUNT(t.id) AS assigned_ticket_count
FROM users u
LEFT JOIN tickets t ON u.id = t.assigned_to AND t.status != 'closed'
WHERE u.role = 'agent'
GROUP BY u.id, u.name, u.email
ORDER BY assigned_ticket_count DESC;
