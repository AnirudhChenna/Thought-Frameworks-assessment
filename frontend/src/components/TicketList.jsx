import React from 'react';
import { 
  MessageSquare, 
  User, 
  Shield, 
  Calendar, 
  ChevronRight, 
  Inbox, 
  AlertCircle 
} from 'lucide-react';

export default function TicketList({ 
  tickets, 
  loading, 
  error, 
  onSelectTicket, 
  userRole, 
  onCreateClick 
}) {
  if (loading) {
    return (
      <div className="ticket-list-loading">
        <div className="spinner"></div>
        <p>Loading support tickets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ticket-list-error card">
        <AlertCircle size={32} color="#f87171" />
        <h3>Unable to load tickets</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="ticket-list-empty card">
        <Inbox size={48} color="#6366f1" />
        <h3>No tickets found</h3>
        <p>
          {userRole === 'customer'
            ? "You haven't submitted any tickets matching the selected filters."
            : 'No customer tickets match the current search or filter criteria.'}
        </p>
        {userRole === 'customer' && (
          <button className="btn btn-primary" onClick={onCreateClick}>
            Raise a Support Ticket
          </button>
        )}
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="ticket-list-container">
      {tickets.map((ticket) => (
        <div
          key={ticket.id}
          className="ticket-card card"
          onClick={() => onSelectTicket(ticket.id)}
          role="button"
          tabIndex={0}
        >
          {/* Card Top Row: ID, Priority, Status */}
          <div className="ticket-card-header">
            <div className="ticket-identifiers">
              <span className="ticket-id">#{ticket.id}</span>
              <span className={`badge badge-priority-${ticket.priority}`}>
                {ticket.priority}
              </span>
            </div>
            <span className={`badge badge-status-${ticket.status}`}>
              {ticket.status.replace('_', ' ')}
            </span>
          </div>

          {/* Subject & Description */}
          <div className="ticket-card-body">
            <h3 className="ticket-subject">{ticket.subject}</h3>
            <p className="ticket-description-snippet">
              {ticket.description}
            </p>
          </div>

          {/* Card Footer: Customer, Assignee, Comments, Date */}
          <div className="ticket-card-footer">
            <div className="ticket-actors">
              {/* Customer Info (Agent view) */}
              {userRole === 'agent' && (
                <div className="ticket-actor-item" title={`Customer: ${ticket.customer_email}`}>
                  <User size={14} className="actor-icon" />
                  <span>{ticket.customer_name}</span>
                </div>
              )}

              {/* Assigned Agent */}
              <div className="ticket-actor-item" title={ticket.assigned_agent_name ? `Assigned Agent: ${ticket.assigned_agent_email}` : 'Unassigned'}>
                <Shield size={14} className="actor-icon" />
                <span>
                  {ticket.assigned_agent_name 
                    ? `Assigned: ${ticket.assigned_agent_name}` 
                    : 'Unassigned'}
                </span>
              </div>
            </div>

            <div className="ticket-meta-right">
              {/* Comments count */}
              <div className="ticket-comments-count" title={`${ticket.comment_count || 0} comments`}>
                <MessageSquare size={14} />
                <span>{ticket.comment_count || 0}</span>
              </div>

              {/* Created Date */}
              <div className="ticket-date" title="Created date">
                <Calendar size={14} />
                <span>{formatDate(ticket.created_at)}</span>
              </div>

              <ChevronRight size={18} className="ticket-arrow" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
