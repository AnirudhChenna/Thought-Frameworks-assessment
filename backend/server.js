require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors()); // allow the React app (different port) to call this API
app.use(express.json()); // parse incoming JSON request bodies into req.body

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/users', require('./routes/users'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
