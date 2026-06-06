const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Import routes (placeholder)
const customerRoutes = require('./routes/customers');
const dashboardRoutes = require('./routes/dashboard');
app.use('/api/customers', customerRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
