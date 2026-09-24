const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Test MySQL connection on boot
  await testConnection();

  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(` Support Ticket Management System Backend running `);
    console.log(` Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(` Port        : ${PORT}`);
    console.log(` URL         : http://localhost:${PORT}`);
    console.log(` Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=================================================`);
  });
};

startServer();
