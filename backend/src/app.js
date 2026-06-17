const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const sequelize = require('./config/database');
const Customer = require('./models/Customer');
const Quotation = require('./models/Quotation');
const Invoice = require('./models/Invoice');

// Establish model associations
Customer.hasMany(Quotation, { foreignKey: 'customerId', as: 'quotations', onDelete: 'CASCADE' });
Quotation.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Customer.hasMany(Invoice, { foreignKey: 'customerId', as: 'invoices', onDelete: 'CASCADE' });
Invoice.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Sync database models
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synced successfully.');
  })
  .catch((err) => {
    console.error('Database sync failed:', err);
  });

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Health check endpoint that also checks DB connection status
app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

// Import and register API routes
const customerRoutes = require('./routes/customers');
const quotationRoutes = require('./routes/quotations');
const invoiceRoutes = require('./routes/invoices');
const dashboardRoutes = require('./routes/dashboard');

app.use('/api/customers', customerRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}

module.exports = app;
