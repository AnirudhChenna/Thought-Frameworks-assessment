import React, { useState } from 'react';
import { X, PlusCircle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function CreateTicketModal({ onClose, onTicketCreated, showToast }) {
  const [formData, setFormData] = useState({
    subject: '',
    priority: 'medium',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.subject.trim()) {
      errs.subject = 'Subject is required';
    } else if (formData.subject.trim().length > 255) {
      errs.subject = 'Subject cannot exceed 255 characters';
    }
    if (!formData.description.trim()) {
      errs.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      errs.description = 'Please describe the issue in at least 10 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await api.tickets.create({
        subject: formData.subject.trim(),
        priority: formData.priority,
        description: formData.description.trim()
      });

      showToast('Support ticket raised successfully!', 'success');
      onTicketCreated(res.ticket);
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to create ticket', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content create-ticket-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <PlusCircle size={22} color="#6366f1" />
            <h3>Raise a Support Ticket</h3>
          </div>
          <button 
            type="button" 
            className="btn btn-ghost btn-sm modal-close-btn" 
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {/* Subject */}
            <div className="form-group">
              <label className="form-label" htmlFor="ticket-subject">
                Subject <span className="required-star">*</span>
              </label>
              <input
                id="ticket-subject"
                type="text"
                className="form-control"
                placeholder="Brief summary of the issue (e.g. Cannot checkout with Visa)"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
              {errors.subject && <span className="form-error">{errors.subject}</span>}
            </div>

            {/* Priority Selection */}
            <div className="form-group">
              <label className="form-label">Priority Level</label>
              <div className="priority-options-grid">
                {[
                  { value: 'low', label: 'Low', desc: 'General questions' },
                  { value: 'medium', label: 'Medium', desc: 'Standard issue' },
                  { value: 'high', label: 'High', desc: 'Major blocker' },
                  { value: 'urgent', label: 'Urgent', desc: 'Critical system outage' }
                ].map((item) => (
                  <label
                    key={item.value}
                    className={`priority-option-card ${
                      formData.priority === item.value ? 'selected' : ''
                    } priority-${item.value}`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={item.value}
                      checked={formData.priority === item.value}
                      onChange={() => setFormData({ ...formData, priority: item.value })}
                    />
                    <div className="priority-card-inner">
                      <span className="priority-name">{item.label}</span>
                      <span className="priority-desc">{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="ticket-desc">
                Detailed Description <span className="required-star">*</span>
              </label>
              <textarea
                id="ticket-desc"
                className="form-textarea"
                rows="5"
                placeholder="Explain the problem in detail. Include steps to reproduce, error codes, and what you expected to happen..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              ></textarea>
              {errors.description && (
                <span className="form-error">{errors.description}</span>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={submitting}
            >
              {submitting ? (
                <span className="spinner"></span>
              ) : (
                <>
                  <PlusCircle size={16} />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
