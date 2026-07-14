const express = require('express');
const router = express.Router();
const PackagingList = require('../models/PackagingList');
const Customer = require('../models/Customer');

// GET /api/packaging-lists - List all packaging lists with associated customer details
router.get('/', async (req, res) => {
  try {
    const packagingLists = await PackagingList.findAll({
      include: [{
        model: Customer,
        as: 'customer'
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(packagingLists);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve packaging lists', details: err.message });
  }
});

// POST /api/packaging-lists - Create a new packaging list
router.post('/', async (req, res) => {
  try {
    const {
      listNo, listDate, sealType, items, notes
    } = req.body;

    const customerId = req.body.customerId || req.body.customer?.id;
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    const packagingList = await PackagingList.create({
      listNo, listDate, sealType, items, notes,
      customerId
    });

    const createdList = await PackagingList.findByPk(listNo, {
      include: [{ model: Customer, as: 'customer' }]
    });

    res.status(201).json(createdList);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create packaging list', details: err.message });
  }
});

// PUT /api/packaging-lists/:listNo - Update an existing packaging list
router.put('/:listNo', async (req, res) => {
  try {
    const { listNo } = req.params;
    const {
      listDate, sealType, items, notes
    } = req.body;

    const packagingList = await PackagingList.findByPk(listNo);
    if (!packagingList) {
      return res.status(404).json({ error: 'Packaging List not found' });
    }

    const customerId = req.body.customerId || req.body.customer?.id || packagingList.customerId;

    await packagingList.update({
      listDate, sealType, items, notes,
      customerId
    });

    const updatedList = await PackagingList.findByPk(listNo, {
      include: [{ model: Customer, as: 'customer' }]
    });

    res.json(updatedList);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update packaging list', details: err.message });
  }
});

// DELETE /api/packaging-lists/:listNo - Delete a packaging list
router.delete('/:listNo', async (req, res) => {
  try {
    const { listNo } = req.params;
    const packagingList = await PackagingList.findByPk(listNo);
    if (!packagingList) {
      return res.status(404).json({ error: 'Packaging List not found' });
    }

    await packagingList.destroy();
    res.json({ message: 'Packaging list deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete packaging list', details: err.message });
  }
});

module.exports = router;
