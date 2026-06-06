const express = require('express');
const router = express.Router();

// GET /api/customers - list all customers (placeholder)
router.get('/', (req, res) => {
  res.json([]);
});

// POST /api/customers - create a new customer (placeholder)
router.post('/', (req, res) => {
  res.status(201).json({ message: 'Customer created (placeholder)' });
});

module.exports = router;
