import React, { useState, useEffect } from 'react';
import { X, Database, Terminal, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function ReportModal({ onClose }) {
  const [openTickets, setOpenTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      try {
        const res = await api.tickets.getOpenWithCustomers();
        setOpenTickets(res.tickets || []);
      } catch (err) {
        setError(err.message || 'Failed to execute query report.');
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, []);

  const sqlQuery = `SELECT 
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
ORDER BY t.created_at DESC;`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content sql-report-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <Database size={20} color="#ffffff" />
            <div>
              <h3>Assessment Requirement 8: SQL JOIN Query</h3>
              <p className="modal-subtitle">
                Returns all open tickets along with customer's name and email using INNER JOIN & WHERE filter
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-ghost btn-sm modal-close-btn" 
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* SQL Query Snippet */}
          <div className="sql-code-box">
            <div className="sql-box-header">
              <Terminal size={14} />
              <span>Executed MySQL Query</span>
            </div>
            <pre className="sql-code">
              <code>{sqlQuery}</code>
            </pre>
          </div>

          {/* Results Table */}
          <div className="report-results-section">
            <div className="report-results-header">
              <h4>Live Query Results ({openTickets.length} rows returned)</h4>
            </div>

            {loading ? (
              <div className="ticket-modal-loading">
                <div className="spinner"></div>
                <p>Executing JOIN query against database...</p>
              </div>
            ) : error ? (
              <div className="auth-alert-error">
                <span>{error}</span>
              </div>
            ) : openTickets.length === 0 ? (
              <div className="ticket-list-empty">
                <CheckCircle2 size={28} color="#ffffff" />
                <p>No open tickets at this time. All tickets are in progress or resolved.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Subject</th>
                      <th>Priority</th>
                      <th>Customer Name</th>
                      <th>Customer Email</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openTickets.map((row) => (
                      <tr key={row.ticket_id}>
                        <td>
                          <span className="ticket-id">#{row.ticket_id}</span>
                        </td>
                        <td className="row-subject">{row.subject}</td>
                        <td>
                          <span className={`badge badge-priority-${row.priority}`}>
                            {row.priority}
                          </span>
                        </td>
                        <td>
                          <span className="customer-cell-name">{row.customer_name}</span>
                        </td>
                        <td className="customer-cell-email">{row.customer_email}</td>
                        <td className="cell-date">
                          {new Date(row.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
