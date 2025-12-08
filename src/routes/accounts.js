// src/routes/accounts.js
const express = require('express');
const router = express.Router();
const accountService = require('../services/accountService');

// POST /accounts
router.post('/', async (req, res) => {
  try {
    const { userId, accountType, currency } = req.body;
    if (!userId || !accountType || !currency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const account = await accountService.createAccount({ userId, accountType, currency });
    res.status(201).json(account);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /accounts/:id
router.get('/:id', async (req, res) => {
  try {
    const account = await accountService.getAccountWithBalance(req.params.id);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /accounts/:id/ledger
router.get('/:id/ledger', async (req, res) => {
  try {
    const ledger = await accountService.getAccountLedger(req.params.id);
    res.json(ledger);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
