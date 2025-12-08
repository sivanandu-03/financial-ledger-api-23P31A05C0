// src/routes/transactions.js
const express = require('express');
const router = express.Router();
const txService = require('../services/transactionService');

// POST /transfers
router.post('/transfers', async (req, res) => {
  try {
    const { sourceAccountId, destinationAccountId, amount, currency, description } = req.body;
    if (!sourceAccountId || !destinationAccountId || !amount || !currency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const tx = await txService.transfer({ sourceAccountId, destinationAccountId, amount, currency, description });
    res.status(201).json(tx);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /deposits
router.post('/deposits', async (req, res) => {
  try {
    const { accountId, amount, currency, description } = req.body;
    if (!accountId || !amount || !currency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const tx = await txService.deposit({ accountId, amount, currency, description });
    res.status(201).json(tx);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /withdrawals
router.post('/withdrawals', async (req, res) => {
  try {
    const { accountId, amount, currency, description } = req.body;
    if (!accountId || !amount || !currency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const tx = await txService.withdraw({ accountId, amount, currency, description });
    res.status(201).json(tx);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
});

module.exports = router;
