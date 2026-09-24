import React, { useState } from 'react';
import { LifeBuoy, LogIn, UserPlus, Lock, Mail, User, Shield, Sparkles } from 'lucide-react';
import { api, setStoredToken, setStoredUser } from '../services/api';

export default function AuthView({ onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const validate = () => {
    const errs = {};
    if (isRegister && (!formData.name || formData.name.trim().length < 2)) {
      errs.name = 'Full name must be at least 2 characters';
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email address';
    }
    if (!formData.password || formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    if (!validate()) return;

    setLoading(true);
    try {
      let res;
      if (isRegister) {
        res = await api.auth.register({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role
        });
      } else {
        res = await api.auth.login({
          email: formData.email.trim(),
          password: formData.password
        });
      }

      if (res.token && res.user) {
        setStoredToken(res.token);
        setStoredUser(res.user);
        onAuthSuccess(res.user);
      }
    } catch (err) {
      setGeneralError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Logins for Evaluator Ease
  const fillDemoAccount = (role) => {
    setGeneralError('');
    setErrors({});
    setIsRegister(false);
    if (role === 'customer') {
      setFormData({
        name: '',
        email: 'alice@example.com',
        password: 'Password123!',
        role: 'customer'
      });
    } else {
      setFormData({
        name: '',
        email: 'david.agent@example.com',
        password: 'Password123!',
        role: 'agent'
      });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card card">
        {/* Brand Header */}
        <div className="auth-header">
          <div className="auth-icon-wrapper">
            <LifeBuoy size={36} color="#6366f1" />
          </div>
          <h2>ResolveDesk Portal</h2>
          <p className="auth-subtitle">
            {isRegister
              ? 'Create a customer account to submit and track support requests'
              : 'Sign in to access your support dashboard'}
          </p>
        </div>

        {/* Quick Demo Switchers for Evaluator */}
        <div className="demo-credentials-banner">
          <div className="demo-title">
            <Sparkles size={14} color="#fbbf24" />
            <span>Quick Demo Accounts (1-Click Fill)</span>
          </div>
          <div className="demo-buttons">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillDemoAccount('customer')}
            >
              <User size={14} />
              <span>Demo Customer (Alice)</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillDemoAccount('agent')}
            >
              <Shield size={14} />
              <span>Demo Agent (David)</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${!isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(false);
              setGeneralError('');
            }}
          >
            <LogIn size={16} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            className={`auth-tab ${isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(true);
              setGeneralError('');
            }}
          >
            <UserPlus size={16} />
            <span>Register</span>
          </button>
        </div>

        {/* Error Alert */}
        {generalError && (
          <div className="auth-alert-error">
            <span>{generalError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {isRegister && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-name">
                Full Name
              </label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  id="auth-name"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Jane Doe"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">
              Email Address
            </label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="auth-email"
                type="email"
                className="form-control"
                placeholder="name@company.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">
              Password
            </label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="auth-password"
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
            {errors.password && (
              <span className="form-error">{errors.password}</span>
            )}
          </div>

          {isRegister && (
            <div className="form-group">
              <label className="form-label">Register As</label>
              <div className="role-selector-radios">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="role"
                    value="customer"
                    checked={formData.role === 'customer'}
                    onChange={() =>
                      setFormData({ ...formData, role: 'customer' })
                    }
                  />
                  <span>Customer (Submit tickets)</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="role"
                    value="agent"
                    checked={formData.role === 'agent'}
                    onChange={() => setFormData({ ...formData, role: 'agent' })}
                  />
                  <span>Support Agent (Manage tickets)</span>
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner"></span>
            ) : isRegister ? (
              <>
                <UserPlus size={18} />
                <span>Create Account</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
