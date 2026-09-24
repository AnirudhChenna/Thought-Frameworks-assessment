import axios from 'axios';

// Base Axios instance as specified in setup reference guide
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

// Attach the JWT to every outgoing request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('support_ticket_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for automatic session handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('support_ticket_token');
      localStorage.removeItem('support_ticket_user');
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(error);
  }
);

export default api;
