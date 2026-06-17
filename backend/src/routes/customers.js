const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// GET /api/customers - List all customers (ordered by newest first)
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve customers', details: err.message });
  }
});

// POST /api/customers - Create a new customer
router.post('/', async (req, res) => {
  try {
    const { name, phone, address, contracts, otherDetails, notes } = req.body;
    const customer = await Customer.create({
      name,
      phone,
      address,
      contracts,
      otherDetails,
      notes
    });
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create customer', details: err.message });
  }
});

// PUT /api/customers/:id - Update an existing customer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, contracts, otherDetails, notes } = req.body;
    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    await customer.update({
      name,
      phone,
      address,
      contracts,
      otherDetails,
      notes
    });
    
    res.json(customer);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update customer', details: err.message });
  }
});

// DELETE /api/customers/:id - Delete a customer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    await customer.destroy();
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete customer', details: err.message });
  }
});

module.exports = router;
