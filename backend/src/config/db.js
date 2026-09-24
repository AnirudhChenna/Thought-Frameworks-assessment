const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const memoryStore = require('./memoryStore');

dotenv.config();

let isUsingFallback = false;

// Create MySQL Connection Pool
const realPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'support_ticket_db',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Proxy pool that delegates to realPool or memoryStore fallback
const pool = {
  query: async (sql, params) => {
    if (isUsingFallback) {
      return memoryStore.query(sql, params);
    }
    try {
      return await realPool.query(sql, params);
    } catch (err) {
      // If MySQL drops or fails mid-run, fallback safely
      console.warn(`[Database] Query fallback triggered: ${err.message}`);
      isUsingFallback = true;
      return memoryStore.query(sql, params);
    }
  },
  getConnection: async () => {
    if (isUsingFallback) {
      return {
        query: (sql, params) => memoryStore.query(sql, params),
        release: () => {}
      };
    }
    return realPool.getConnection();
  }
};

// Helper for test connection
const testConnection = async () => {
  try {
    const connection = await realPool.getConnection();
    console.log(`[Database] Connected successfully to MySQL (${process.env.DB_NAME || 'support_ticket_db'})`);
    connection.release();
    isUsingFallback = false;
    return true;
  } catch (error) {
    console.log(`[Database] Local MySQL notice (${error.code || error.message}).`);
    console.log(`[Database] Running in-memory database simulation with pre-seeded customers, agents, and tickets.`);
    isUsingFallback = true;
    return false;
  }
};

module.exports = {
  pool,
  testConnection,
  getIsFallback: () => isUsingFallback
};
