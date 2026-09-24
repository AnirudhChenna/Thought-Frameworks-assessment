import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import AuthView from './components/AuthView';
import StatsBar from './components/StatsBar';
import TicketFilters from './components/TicketFilters';
import TicketList from './components/TicketList';
import TicketDetailModal from './components/TicketDetailModal';
import CreateTicketModal from './components/CreateTicketModal';
import ReportModal from './components/ReportModal';
import { 
  api, 
  getStoredToken, 
  getStoredUser, 
  removeStoredToken 
} from './services/api';
import './App.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketsError, setTicketsError] = useState('');

  // Filtering state
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });

  // Modals state
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Handle session expiration
  useEffect(() => {
    const handleAuthExpired = () => {
      setCurrentUser(null);
      showToast('Session expired. Please log in again.', 'error');
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, [showToast]);

  // Fetch Tickets
  const fetchTickets = useCallback(async () => {
    if (!currentUser) return;
    setLoadingTickets(true);
    setTicketsError('');
    try {
      const res = await api.tickets.getAll(filters);
      setTickets(res.tickets || []);
    } catch (err) {
      setTicketsError(err.message || 'Failed to fetch tickets');
    } finally {
      setLoadingTickets(false);
    }
  }, [currentUser, filters]);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    if (!currentUser) return;
    try {
      if (currentUser.role === 'agent') {
        const res = await api.tickets.getStats();
        setStats(res.stats);
      } else {
        // For customer, fetch all own tickets to calculate stats accurately
        const res = await api.tickets.getAll({});
        const allOwn = res.tickets || [];
        setStats({
          total: allOwn.length,
          open: allOwn.filter((t) => t.status === 'open').length,
          in_progress: allOwn.filter((t) => t.status === 'in_progress').length,
          resolved: allOwn.filter((t) => t.status === 'resolved' || t.status === 'closed').length
        });
      }
    } catch (err) {
      console.warn('Failed to load stats:', err.message);
    }
  }, [currentUser]);

  // Fetch data on filter change or login
  useEffect(() => {
    if (currentUser) {
      fetchTickets();
      fetchStats();
    }
  }, [currentUser, fetchTickets, fetchStats]);

  const handleLogout = () => {
    removeStoredToken();
    setCurrentUser(null);
    setTickets([]);
    setStats(null);
    setSelectedTicketId(null);
    showToast('Logged out successfully', 'success');
  };

  const handleResetFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      search: '',
      sortBy: 'created_at',
      sortOrder: 'DESC'
    });
  };

  return (
    <div className="app-shell">
      {/* Navbar */}
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        activeTab="tickets"
        setActiveTab={() => {}}
      />

      <main className="main-content">
        {!currentUser ? (
          <AuthView onAuthSuccess={(user) => setCurrentUser(user)} />
        ) : (
          <>
            {/* KPI Statistics Bar */}
            <StatsBar
              stats={stats}
              userRole={currentUser.role}
              currentFilter={filters}
              onFilterChange={(newFilters) =>
                setFilters((prev) => ({ ...prev, ...newFilters }))
              }
            />

            {/* Ticket Search & Filter Controls */}
            <TicketFilters
              filters={filters}
              setFilters={setFilters}
              onReset={handleResetFilters}
            />

            {/* Ticket List View */}
            <TicketList
              tickets={tickets}
              loading={loadingTickets}
              error={ticketsError}
              userRole={currentUser.role}
              onSelectTicket={(id) => setSelectedTicketId(id)}
              onCreateClick={() => setIsCreateModalOpen(true)}
            />
          </>
        )}
      </main>

      {/* Ticket Details & Discussion Modal */}
      {selectedTicketId && currentUser && (
        <TicketDetailModal
          ticketId={selectedTicketId}
          currentUser={currentUser}
          onClose={() => setSelectedTicketId(null)}
          onTicketUpdated={() => {
            fetchTickets();
            fetchStats();
          }}
          showToast={showToast}
        />
      )}

      {/* Customer Create Ticket Modal */}
      {isCreateModalOpen && (
        <CreateTicketModal
          onClose={() => setIsCreateModalOpen(false)}
          onTicketCreated={(newTicket) => {
            fetchTickets();
            fetchStats();
            setSelectedTicketId(newTicket.id);
          }}
          showToast={showToast}
        />
      )}

      {/* Requirement 8: SQL JOIN Query Report Modal */}
      {isReportModalOpen && (
        <ReportModal onClose={() => setIsReportModalOpen(false)} />
      )}

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
