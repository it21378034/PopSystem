const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');
const Customer = require('../models/Customer');

// GET /api/quotations - List all quotations with associated customer details
router.get('/', async (req, res) => {
  try {
    const quotations = await Quotation.findAll({
      include: [{
        model: Customer,
        as: 'customer'
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(quotations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve quotations', details: err.message });
  }
});

// POST /api/quotations - Create a new quotation
router.post('/', async (req, res) => {
  try {
    const {
      quotNo, quotDate, validUntil, projectName, siteLocation, startDate,
      materials, labours, extras, discount, paymentTerms, tcLines, notes,
      materialTotal, labourTotal, extraTotal, subtotal, discountAmt, grandTotal
    } = req.body;

    const customerId = req.body.customerId || req.body.customer?.id;
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    const quotation = await Quotation.create({
      quotNo, quotDate, validUntil, projectName, siteLocation, startDate,
      materials, labours, extras, discount, paymentTerms, tcLines, notes,
      materialTotal, labourTotal, extraTotal, subtotal, discountAmt, grandTotal,
      customerId
    });

    // Fetch quotation with customer relation to return to frontend
    const createdQuotation = await Quotation.findByPk(quotNo, {
      include: [{ model: Customer, as: 'customer' }]
    });

    res.status(201).json(createdQuotation);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create quotation', details: err.message });
  }
});

// PUT /api/quotations/:quotNo - Update an existing quotation
router.put('/:quotNo', async (req, res) => {
  try {
    const { quotNo } = req.params;
    const {
      quotDate, validUntil, projectName, siteLocation, startDate,
      materials, labours, extras, discount, paymentTerms, tcLines, notes,
      materialTotal, labourTotal, extraTotal, subtotal, discountAmt, grandTotal
    } = req.body;

    const quotation = await Quotation.findByPk(quotNo);
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const customerId = req.body.customerId || req.body.customer?.id || quotation.customerId;

    await quotation.update({
      quotDate, validUntil, projectName, siteLocation, startDate,
      materials, labours, extras, discount, paymentTerms, tcLines, notes,
      materialTotal, labourTotal, extraTotal, subtotal, discountAmt, grandTotal,
      customerId
    });

    const updatedQuotation = await Quotation.findByPk(quotNo, {
      include: [{ model: Customer, as: 'customer' }]
    });

    res.json(updatedQuotation);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update quotation', details: err.message });
  }
});

// DELETE /api/quotations/:quotNo - Delete a quotation
router.delete('/:quotNo', async (req, res) => {
  try {
    const { quotNo } = req.params;
    const quotation = await Quotation.findByPk(quotNo);
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    await quotation.destroy();
    res.json({ message: 'Quotation deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete quotation', details: err.message });
  }
});

module.exports = router;
