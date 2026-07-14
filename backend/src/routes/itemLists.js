const express = require('express');
const router = express.Router();
const ItemList = require('../models/ItemList');
const Customer = require('../models/Customer');

// GET /api/item-lists - List all item lists with associated customer details
router.get('/', async (req, res) => {
  try {
    const itemLists = await ItemList.findAll({
      include: [{
        model: Customer,
        as: 'customer'
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(itemLists);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve item lists', details: err.message });
  }
});

// POST /api/item-lists - Create a new item list
router.post('/', async (req, res) => {
  try {
    const {
      listNo, listDate, sealType, items, notes
    } = req.body;

    const customerId = req.body.customerId || req.body.customer?.id;
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    const itemList = await ItemList.create({
      listNo, listDate, sealType, items, notes,
      customerId
    });

    const createdList = await ItemList.findByPk(listNo, {
      include: [{ model: Customer, as: 'customer' }]
    });

    res.status(201).json(createdList);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create item list', details: err.message });
  }
});

// PUT /api/item-lists/:listNo - Update an existing item list
router.put('/:listNo', async (req, res) => {
  try {
    const { listNo } = req.params;
    const {
      listDate, sealType, items, notes
    } = req.body;

    const itemList = await ItemList.findByPk(listNo);
    if (!itemList) {
      return res.status(404).json({ error: 'Item List not found' });
    }

    const customerId = req.body.customerId || req.body.customer?.id || itemList.customerId;

    await itemList.update({
      listDate, sealType, items, notes,
      customerId
    });

    const updatedList = await ItemList.findByPk(listNo, {
      include: [{ model: Customer, as: 'customer' }]
    });

    res.json(updatedList);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update item list', details: err.message });
  }
});

// DELETE /api/item-lists/:listNo - Delete an item list
router.delete('/:listNo', async (req, res) => {
  try {
    const { listNo } = req.params;
    const itemList = await ItemList.findByPk(listNo);
    if (!itemList) {
      return res.status(404).json({ error: 'Item List not found' });
    }

    await itemList.destroy();
    res.json({ message: 'Item list deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete item list', details: err.message });
  }
});

module.exports = router;
