const express = require('express');
const router = express.Router();

// Placeholder dashboard data
router.get('/', (req, res) => {
  res.json({
    revenue: 0,
    pendingQuotations: 0,
    unpaidInvoices: 0,
    totalCustomers: 0,
    lowStockAlerts: 0,
    monthlySales: []
  });
});

module.exports = router;
