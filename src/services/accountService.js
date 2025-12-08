// src/services/accountService.js
const db = require('../db');

// Create account
async function createAccount({ userId, accountType, currency }) {
  const result = await db.query(
    `INSERT INTO accounts (user_id, account_type, currency, status)
     VALUES ($1, $2, $3, 'active')
     RETURNING *`,
    [userId, accountType, currency]
  );
  return result.rows[0];
}

// Get account details + balance
async function getAccountWithBalance(accountId) {
  const accountRes = await db.query(
    'SELECT * FROM accounts WHERE id = $1',
    [accountId]
  );
  if (accountRes.rowCount === 0) return null;

  const balanceRes = await db.query(
    `SELECT COALESCE(
        SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE -amount END), 0
      ) AS balance
     FROM ledger_entries
     WHERE account_id = $1`,
    [accountId]
  );

  const account = accountRes.rows[0];
  account.balance = balanceRes.rows[0].balance;
  return account;
}

// Account ledger entries
async function getAccountLedger(accountId) {
  const res = await db.query(
    `SELECT * FROM ledger_entries
     WHERE account_id = $1
     ORDER BY created_at ASC`,
    [accountId]
  );
  return res.rows;
}

module.exports = {
  createAccount,
  getAccountWithBalance,
  getAccountLedger,
};
