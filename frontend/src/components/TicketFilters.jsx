import React from 'react';
import { Search, Filter, ArrowUpDown, X } from 'lucide-react';

export default function TicketFilters({ filters, setFilters, onReset }) {
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const sortOptions = [
    { value: 'created_at-DESC', label: 'Newest First' },
    { value: 'created_at-ASC', label: 'Oldest First' },
    { value: 'updated_at-DESC', label: 'Recently Updated' },
    { value: 'priority-DESC', label: 'Highest Priority' }
  ];

  const handleSortChange = (e) => {
    const [sortBy, sortOrder] = e.target.value.split('-');
    setFilters({ ...filters, sortBy, sortOrder });
  };

  const isFiltered =
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    (filters.search && filters.search.trim() !== '') ||
    filters.sortBy !== 'created_at' ||
    filters.sortOrder !== 'DESC';

  return (
    <div className="filters-card card">
      {/* Search Input */}
      <div className="filter-search-box">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="form-control filter-search-input"
          placeholder="Search tickets by subject or description..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        {filters.search && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => setFilters({ ...filters, search: '' })}
            title="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="filters-row">
        {/* Status Dropdown */}
        <div className="filter-select-wrapper">
          <Filter size={16} className="filter-select-icon" />
          <select
            className="form-select filter-select"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Dropdown */}
        <div className="filter-select-wrapper">
          <select
            className="form-select filter-select"
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          >
            {priorityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="filter-select-wrapper">
          <ArrowUpDown size={16} className="filter-select-icon" />
          <select
            className="form-select filter-select"
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={handleSortChange}
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Filter Button */}
        {isFiltered && (
          <button
            type="button"
            className="btn btn-ghost btn-sm reset-filters-btn"
            onClick={onReset}
            title="Reset all filters"
          >
            <X size={14} />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
