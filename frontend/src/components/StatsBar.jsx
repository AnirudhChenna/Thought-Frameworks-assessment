import React from 'react';
import { 
  Inbox, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Layers 
} from 'lucide-react';

export default function StatsBar({ stats, userRole, currentFilter, onFilterChange }) {
  if (!stats) return null;

  const isAgent = userRole === 'agent';

  const cards = isAgent
    ? [
        {
          key: 'all',
          label: 'Total Tickets',
          value: stats.total || 0,
          icon: Layers,
          colorClass: 'stat-total',
          filterKey: 'all'
        },
        {
          key: 'open',
          label: 'Open',
          value: stats.open || 0,
          icon: Inbox,
          colorClass: 'stat-open',
          filterKey: 'open'
        },
        {
          key: 'in_progress',
          label: 'In Progress',
          value: stats.in_progress || 0,
          icon: Clock,
          colorClass: 'stat-progress',
          filterKey: 'in_progress'
        },
        {
          key: 'resolved',
          label: 'Resolved',
          value: stats.resolved || 0,
          icon: CheckCircle2,
          colorClass: 'stat-resolved',
          filterKey: 'resolved'
        },
        {
          key: 'urgent',
          label: 'Urgent Attention',
          value: stats.urgent || 0,
          icon: AlertTriangle,
          colorClass: 'stat-urgent',
          priorityFilter: 'urgent'
        }
      ]
    : [
        {
          key: 'all',
          label: 'My Tickets',
          value: stats.total || 0,
          icon: Layers,
          colorClass: 'stat-total',
          filterKey: 'all'
        },
        {
          key: 'open',
          label: 'Open Issues',
          value: stats.open || 0,
          icon: Inbox,
          colorClass: 'stat-open',
          filterKey: 'open'
        },
        {
          key: 'in_progress',
          label: 'In Progress',
          value: stats.in_progress || 0,
          icon: Clock,
          colorClass: 'stat-progress',
          filterKey: 'in_progress'
        },
        {
          key: 'resolved',
          label: 'Resolved',
          value: stats.resolved || 0,
          icon: CheckCircle2,
          colorClass: 'stat-resolved',
          filterKey: 'resolved'
        }
      ];

  return (
    <div className="stats-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = 
          (card.filterKey && currentFilter.status === card.filterKey) ||
          (card.priorityFilter && currentFilter.priority === card.priorityFilter);

        return (
          <div
            key={card.key}
            className={`stat-card card ${card.colorClass} ${isActive ? 'active-stat' : ''}`}
            onClick={() => {
              if (card.priorityFilter) {
                onFilterChange({ status: 'all', priority: card.priorityFilter });
              } else if (card.filterKey) {
                onFilterChange({ status: card.filterKey, priority: 'all' });
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="stat-icon-box">
              <Icon size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{card.value}</span>
              <span className="stat-label">{card.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
