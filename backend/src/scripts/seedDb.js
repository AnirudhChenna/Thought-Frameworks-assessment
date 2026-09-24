const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

async function seedDatabase() {
  console.log('[DB Seed] Starting MySQL database seeding...');

  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'support_ticket_db',
    multipleStatements: true
  };

  let connection;
  try {
    connection = await mysql.createConnection(connectionConfig);
    console.log('[DB Seed] Connected to MySQL database.');

    const seedPath = path.resolve(__dirname, '../../../database/seed.sql');
    if (!fs.existsSync(seedPath)) {
      throw new Error(`Seed file not found at: ${seedPath}`);
    }

    const seedSql = fs.readFileSync(seedPath, 'utf8');
    console.log('[DB Seed] Executing seed.sql...');
    await connection.query(seedSql);

    console.log('[DB Seed] Database seeded successfully with demo users, tickets, and comments!');
    console.log('--- Demo Accounts ---');
    console.log('Customer: alice@example.com / Password123!');
    console.log('Customer: bob@example.com / Password123!');
    console.log('Support Agent: david.agent@example.com / Password123!');
    console.log('Support Agent: emma.agent@example.com / Password123!');
  } catch (err) {
    console.error('[DB Seed] Error during database seeding:', err.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
