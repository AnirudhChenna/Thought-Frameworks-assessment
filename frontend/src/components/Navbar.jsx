import React from 'react';
import { 
  LifeBuoy, 
  PlusCircle, 
  LogOut, 
  User, 
  ShieldCheck, 
  BarChart3 
} from 'lucide-react';

export default function Navbar({ 
  user, 
  onLogout, 
  onOpenCreateModal, 
  activeTab, 
  setActiveTab,
  onOpenReportModal 
}) {
  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <div className="navbar-brand" onClick={() => setActiveTab('tickets')}>
          <div className="brand-icon">
            <LifeBuoy size={24} color="#ffffff" />
          </div>
          <div className="brand-text">
            <span className="brand-title">ResolveDesk</span>
            <span className="brand-subtitle">Support System</span>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="navbar-actions">
          {user && (
            <>
              {/* Agent Report Button (Requirement 8 Showcase) */}
              {user.role === 'agent' && (
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={onOpenReportModal}
                  title="View Requirement 8 JOIN Query Report"
                >
                  <BarChart3 size={16} />
                  <span>SQL Join Report</span>
                </button>
              )}

              {/* Customer Create Ticket Button */}
              {user.role === 'customer' && (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={onOpenCreateModal}
                >
                  <PlusCircle size={16} />
                  <span>Raise Ticket</span>
                </button>
              )}

              {/* User Profile Info */}
              <div className="user-profile-badge">
                <div className="user-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="user-meta">
                  <span className="user-name">{user.name}</span>
                  <span className={`badge badge-role-${user.role}`}>
                    {user.role === 'agent' ? (
                      <>
                        <ShieldCheck size={12} />
                        Support Agent
                      </>
                    ) : (
                      <>
                        <User size={12} />
                        Customer
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button 
                className="btn btn-ghost btn-sm logout-btn"
                onClick={onLogout}
                title="Log out of system"
              >
                <LogOut size={18} />
                <span className="logout-text">Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
