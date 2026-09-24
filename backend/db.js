require('dotenv').config();
const mysql = require('mysql2/promise');
const memoryStore = require('./src/config/memoryStore');

let isUsingFallback = false;

// Create MySQL Connection Pool
const realPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'support_tickets',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Proxy pool delegating to real MySQL pool or in-memory fallback
const pool = {
  execute: async (sql, params = []) => {
    if (isUsingFallback) {
      return memoryStore.query(sql, params);
    }
    try {
      return await realPool.execute(sql, params);
    } catch (err) {
      // Fallback if local credentials are not configured or connection failed
      console.warn(`[Database] Query fallback: ${err.message}`);
      isUsingFallback = true;
      return memoryStore.query(sql, params);
    }
  },
  query: async (sql, params = []) => {
    if (isUsingFallback) {
      return memoryStore.query(sql, params);
    }
    try {
      return await realPool.query(sql, params);
    } catch (err) {
      console.warn(`[Database] Query fallback: ${err.message}`);
      isUsingFallback = true;
      return memoryStore.query(sql, params);
    }
  },
  getConnection: async () => {
    if (isUsingFallback) {
      return {
        query: (sql, params) => memoryStore.query(sql, params),
        execute: (sql, params) => memoryStore.query(sql, params),
        release: () => {}
      };
    }
    return realPool.getConnection();
  }
};

module.exports = pool;
