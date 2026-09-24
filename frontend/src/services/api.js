// Base API service with automatic JWT authentication
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const getStoredToken = () => localStorage.getItem('support_ticket_token');
export const setStoredToken = (token) => localStorage.setItem('support_ticket_token', token);
export const removeStoredToken = () => {
  localStorage.removeItem('support_ticket_token');
  localStorage.removeItem('support_ticket_user');
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('support_ticket_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  localStorage.setItem('support_ticket_user', JSON.stringify(user));
};

// Generic fetch wrapper
async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // If token is invalid or expired, clear local storage
    if (response.status === 401 && token) {
      removeStoredToken();
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    const errorMsg = data.error || (data.errors && data.errors[0]?.message) || `HTTP Error ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  auth: {
    login: (credentials) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),
    register: (userData) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      }),
    me: () => request('/auth/me')
  },

  tickets: {
    getAll: (params = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, val);
        }
      });
      const query = searchParams.toString();
      return request(`/tickets${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/tickets/${id}`),
    create: (ticketData) =>
      request('/tickets', {
        method: 'POST',
        body: JSON.stringify(ticketData)
      }),
    update: (id, updates) =>
      request(`/tickets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      }),
    delete: (id) =>
      request(`/tickets/${id}`, {
        method: 'DELETE'
      }),
    getStats: () => request('/tickets/stats/summary'),
    getOpenWithCustomers: () => request('/tickets/reports/open-with-customers')
  },

  comments: {
    getForTicket: (ticketId) => request(`/tickets/${ticketId}/comments`),
    add: (ticketId, comment) =>
      request(`/tickets/${ticketId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ comment })
      })
  },

  users: {
    getAgents: () => request('/users?role=agent')
  }
};
