import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  ShieldCheck, 
  Send, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Tag,
  Clock
} from 'lucide-react';
import { api } from '../services/api';

export default function TicketDetailModal({ 
  ticketId, 
  currentUser, 
  onClose, 
  onTicketUpdated, 
  showToast 
}) {
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingTicket, setUpdatingTicket] = useState(false);
  const [error, setError] = useState('');

  // Fetch ticket details, comments, and agents
  useEffect(() => {
    let isMounted = true;

    async function loadDetails() {
      setLoading(true);
      setError('');
      try {
        const [ticketRes, commentsRes] = await Promise.all([
          api.tickets.getById(ticketId),
          api.comments.getForTicket(ticketId)
        ]);

        if (isMounted) {
          setTicket(ticketRes.ticket);
          setComments(commentsRes.comments || []);
        }

        // If agent, load agent list for assignment dropdown
        if (currentUser.role === 'agent') {
          const agentsRes = await api.users.getAgents();
          if (isMounted) {
            setAgents(agentsRes.users || []);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load ticket details.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (ticketId) {
      loadDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [ticketId, currentUser.role]);

  // Handle Status Change
  const handleStatusChange = async (newStatus) => {
    if (!ticket) return;
    setUpdatingTicket(true);
    try {
      const res = await api.tickets.update(ticket.id, { status: newStatus });
      setTicket(res.ticket);
      onTicketUpdated();
      showToast(`Status updated to ${newStatus.replace('_', ' ')}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingTicket(false);
    }
  };

  // Handle Priority Change
  const handlePriorityChange = async (newPriority) => {
    if (!ticket) return;
    setUpdatingTicket(true);
    try {
      const res = await api.tickets.update(ticket.id, { priority: newPriority });
      setTicket(res.ticket);
      onTicketUpdated();
      showToast(`Priority updated to ${newPriority}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update priority', 'error');
    } finally {
      setUpdatingTicket(false);
    }
  };

  // Handle Assignee Change
  const handleAssigneeChange = async (e) => {
    const val = e.target.value;
    const newAssignedTo = val === '' ? null : parseInt(val, 10);
    setUpdatingTicket(true);
    try {
      const res = await api.tickets.update(ticket.id, { assigned_to: newAssignedTo });
      setTicket(res.ticket);
      onTicketUpdated();
      showToast('Ticket assignment updated', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update assignment', 'error');
    } finally {
      setUpdatingTicket(false);
    }
  };

  // Submit Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await api.comments.add(ticket.id, commentText.trim());
      setComments([...comments, res.comment]);
      setCommentText('');
      showToast('Comment submitted', 'success');
      onTicketUpdated(); // Refresh parent comment counts
    } catch (err) {
      showToast(err.message || 'Failed to add comment', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content ticket-detail-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="ticket-detail-title-wrapper">
            <span className="ticket-detail-id">Ticket #{ticketId}</span>
            {ticket && (
              <div className="ticket-detail-badges">
                <span className={`badge badge-status-${ticket.status}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
                <span className={`badge badge-priority-${ticket.priority}`}>
                  {ticket.priority}
                </span>
              </div>
            )}
          </div>
          <button 
            className="btn btn-ghost btn-sm modal-close-btn" 
            onClick={onClose}
            title="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {loading ? (
            <div className="ticket-modal-loading">
              <div className="spinner"></div>
              <p>Loading ticket discussion...</p>
            </div>
          ) : error ? (
            <div className="auth-alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          ) : ticket ? (
            <>
              {/* Ticket Subject and Meta Box */}
              <div className="ticket-detail-main">
                <h2 className="ticket-detail-subject">{ticket.subject}</h2>

                <div className="ticket-meta-grid">
                  <div className="ticket-meta-block">
                    <span className="meta-block-label">Created By</span>
                    <div className="meta-block-val">
                      <User size={14} />
                      <span>{ticket.customer_name} ({ticket.customer_email})</span>
                    </div>
                  </div>

                  <div className="ticket-meta-block">
                    <span className="meta-block-label">Assigned Agent</span>
                    <div className="meta-block-val">
                      <ShieldCheck size={14} />
                      <span>{ticket.assigned_agent_name || 'Unassigned'}</span>
                    </div>
                  </div>

                  <div className="ticket-meta-block">
                    <span className="meta-block-label">Created On</span>
                    <div className="meta-block-val">
                      <Calendar size={14} />
                      <span>{formatDate(ticket.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="ticket-detail-description">
                  <h4 className="detail-section-title">Description</h4>
                  <div className="description-text">{ticket.description}</div>
                </div>
              </div>

              {/* Action Controls for Agent & Customer */}
              <div className="ticket-controls-card">
                <h4 className="detail-section-title">
                  <Tag size={16} />
                  <span>Ticket Controls</span>
                </h4>

                {currentUser.role === 'agent' ? (
                  <div className="agent-controls-row">
                    {/* Status Dropdown */}
                    <div className="control-group">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={updatingTicket}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    {/* Priority Dropdown */}
                    <div className="control-group">
                      <label className="form-label">Priority</label>
                      <select
                        className="form-select"
                        value={ticket.priority}
                        onChange={(e) => handlePriorityChange(e.target.value)}
                        disabled={updatingTicket}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    {/* Assigned Agent Dropdown */}
                    <div className="control-group">
                      <label className="form-label">Assign Agent</label>
                      <select
                        className="form-select"
                        value={ticket.assigned_to || ''}
                        onChange={handleAssigneeChange}
                        disabled={updatingTicket}
                      >
                        <option value="">Unassigned</option>
                        {agents.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name} ({agent.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="customer-controls-row">
                    {ticket.status !== 'closed' ? (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleStatusChange('closed')}
                        disabled={updatingTicket}
                      >
                        <CheckCircle size={16} />
                        <span>Close My Ticket</span>
                      </button>
                    ) : (
                      <div className="ticket-closed-note">
                        <Clock size={16} />
                        <span>This ticket is closed. Submit a new ticket for further assistance.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Comments / Responses Thread */}
              <div className="comments-section">
                <h4 className="detail-section-title">
                  <span>Responses & Activity</span>
                  <span className="comments-count-pill">{comments.length}</span>
                </h4>

                <div className="comments-stream">
                  {comments.length === 0 ? (
                    <div className="no-comments-prompt">
                      <span>No responses yet. Be the first to leave a message.</span>
                    </div>
                  ) : (
                    comments.map((c) => {
                      const isCurrentUser = c.user_id === currentUser.id;
                      const isAgent = c.author_role === 'agent';

                      return (
                        <div
                          key={c.id}
                          className={`comment-bubble ${
                            isCurrentUser ? 'comment-mine' : 'comment-other'
                          } ${isAgent ? 'comment-agent' : ''}`}
                        >
                          <div className="comment-header">
                            <div className="comment-author-info">
                              <span className="comment-author-name">{c.author_name}</span>
                              <span className={`badge badge-role-${c.author_role}`}>
                                {c.author_role === 'agent' ? 'Support Agent' : 'Customer'}
                              </span>
                            </div>
                            <span className="comment-time">{formatDate(c.created_at)}</span>
                          </div>
                          <div className="comment-body-text">{c.comment}</div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="add-comment-form">
                  <div className="form-group">
                    <label className="form-label" htmlFor="reply-comment">
                      Add a Reply
                    </label>
                    <textarea
                      id="reply-comment"
                      className="form-textarea"
                      rows="3"
                      placeholder={
                        currentUser.role === 'agent'
                          ? 'Type your official response to the customer...'
                          : 'Provide additional details or ask a follow-up question...'
                      }
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="comment-submit-wrapper">
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={submittingComment || !commentText.trim()}
                    >
                      {submittingComment ? (
                        <span className="spinner"></span>
                      ) : (
                        <>
                          <Send size={14} />
                          <span>Send Response</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
