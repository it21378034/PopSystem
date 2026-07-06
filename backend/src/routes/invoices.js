const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');

// GET /api/invoices - List all invoices with associated customer details
router.get('/', async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      include: [{
        model: Customer,
        as: 'customer'
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve invoices', details: err.message });
  }
});

// POST /api/invoices - Create a new invoice
router.post('/', async (req, res) => {
  try {
    const {
      invoiceNo, invoiceDate, sealType, items, notes, subtotal, grandTotal, showTotals
    } = req.body;

    const customerId = req.body.customerId || req.body.customer?.id;
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    const invoice = await Invoice.create({
      invoiceNo, invoiceDate, sealType, items, notes, subtotal, grandTotal, showTotals,
      customerId
    });

    // Fetch invoice with customer relation to return to frontend
    const createdInvoice = await Invoice.findByPk(invoiceNo, {
      include: [{ model: Customer, as: 'customer' }]
    });

    res.status(201).json(createdInvoice);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create invoice', details: err.message });
  }
});

// PUT /api/invoices/:invoiceNo - Update an existing invoice
router.put('/:invoiceNo', async (req, res) => {
  try {
    const { invoiceNo } = req.params;
    const {
      invoiceDate, sealType, items, notes, subtotal, grandTotal, showTotals
    } = req.body;

    const invoice = await Invoice.findByPk(invoiceNo);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const customerId = req.body.customerId || req.body.customer?.id || invoice.customerId;

    await invoice.update({
      invoiceDate, sealType, items, notes, subtotal, grandTotal, showTotals,
      customerId
    });

    const updatedInvoice = await Invoice.findByPk(invoiceNo, {
      include: [{ model: Customer, as: 'customer' }]
    });

    res.json(updatedInvoice);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update invoice', details: err.message });
  }
});

// DELETE /api/invoices/:invoiceNo - Delete an invoice
router.delete('/:invoiceNo', async (req, res) => {
  try {
    const { invoiceNo } = req.params;
    const invoice = await Invoice.findByPk(invoiceNo);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    await invoice.destroy();
    res.json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete invoice', details: err.message });
  }
});

module.exports = router;
