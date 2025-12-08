// src/app.js
const express = require('express');
const accountsRouter = require('./routes/accounts');
const transactionsRouter = require('./routes/transactions');

const app = express();
app.use(express.json());

app.use('/accounts', accountsRouter);
app.use('/', transactionsRouter); // /transfers, /deposits, /withdrawals

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

module.exports = app;
