// src/services/transactionService.js
const db = require('../db');

const SYSTEM_ACCOUNT_ID = process.env.SYSTEM_ACCOUNT_ID; // for deposits/withdrawals

async function getBalanceInTx(client, accountId) {
  const res = await client.query(
    `SELECT COALESCE(
        SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE -amount END), 0
      ) AS balance
     FROM ledger_entries
     WHERE account_id = $1`,
    [accountId]
  );
  return res.rows[0].balance;
}

// TRANSFER between 2 internal accounts
async function transfer({ sourceAccountId, destinationAccountId, amount, currency, description }) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Lock both accounts to avoid race conditions
    await client.query(
      `SELECT id FROM accounts 
       WHERE id IN ($1, $2) FOR UPDATE`,
      [sourceAccountId, destinationAccountId]
    );

    // Check currencies match
    const accRes = await client.query(
      'SELECT id, currency, status FROM accounts WHERE id IN ($1, $2)',
      [sourceAccountId, destinationAccountId]
    );
    if (accRes.rowCount !== 2) {
      throw { status: 404, message: 'One or both accounts not found' };
    }

    const src = accRes.rows.find(a => a.id === sourceAccountId);
    const dst = accRes.rows.find(a => a.id === destinationAccountId);

    if (src.status !== 'active' || dst.status !== 'active') {
      throw { status: 422, message: 'Account is not active' };
    }

    if (src.currency !== currency || dst.currency !== currency) {
      throw { status: 400, message: 'Currency mismatch' };
    }

    // Check balance (inside tx)
    const srcBalance = await getBalanceInTx(client, sourceAccountId);
    if (Number(srcBalance) < Number(amount)) {
      throw { status: 422, message: 'Insufficient funds' };
    }

    // Create transaction in pending state
    const txRes = await client.query(
      `INSERT INTO transactions 
        (tx_type, source_account_id, destination_account_id, amount, currency, status, description)
       VALUES ('transfer', $1, $2, $3, $4, 'pending', $5)
       RETURNING *`,
      [sourceAccountId, destinationAccountId, amount, currency, description || null]
    );
    const transaction = txRes.rows[0];

    // Double-entry ledger
    // 1) Debit source
    await client.query(
      `INSERT INTO ledger_entries (account_id, transaction_id, entry_type, amount)
       VALUES ($1, $2, 'debit', $3)`,
      [sourceAccountId, transaction.id, amount]
    );

    // 2) Credit destination
    await client.query(
      `INSERT INTO ledger_entries (account_id, transaction_id, entry_type, amount)
       VALUES ($1, $2, 'credit', $3)`,
      [destinationAccountId, transaction.id, amount]
    );

    // Mark transaction as completed
    const completedRes = await client.query(
      `UPDATE transactions
       SET status = 'completed'
       WHERE id = $1
       RETURNING *`,
      [transaction.id]
    );

    await client.query('COMMIT');
    return completedRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.status) throw err;
    console.error(err);
    throw { status: 500, message: 'Internal server error' };
  } finally {
    client.release();
  }
}

// DEPOSIT (System -> user account)
async function deposit({ accountId, amount, currency, description }) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Lock account + system account
    await client.query(
      `SELECT id FROM accounts 
       WHERE id IN ($1, $2) FOR UPDATE`,
      [accountId, SYSTEM_ACCOUNT_ID]
    );

    const accRes = await client.query(
      'SELECT id, currency, status FROM accounts WHERE id IN ($1, $2)',
      [accountId, SYSTEM_ACCOUNT_ID]
    );
    if (accRes.rowCount !== 2) throw { status: 500, message: 'System account not configured' };

    const userAcc = accRes.rows.find(a => a.id === accountId);
    const sysAcc = accRes.rows.find(a => a.id === SYSTEM_ACCOUNT_ID);

    if (userAcc.status !== 'active') throw { status: 422, message: 'Account is not active' };
    if (userAcc.currency !== currency || sysAcc.currency !== currency) {
      throw { status: 400, message: 'Currency mismatch' };
    }

    const txRes = await client.query(
      `INSERT INTO transactions 
        (tx_type, source_account_id, destination_account_id, amount, currency, status, description)
       VALUES ('deposit', $1, $2, $3, $4, 'pending', $5)
       RETURNING *`,
      [SYSTEM_ACCOUNT_ID, accountId, amount, currency, description || null]
    );
    const transaction = txRes.rows[0];

    // System loses money (debit), user gains (credit)
    await client.query(
      `INSERT INTO ledger_entries (account_id, transaction_id, entry_type, amount)
       VALUES ($1, $2, 'debit', $3)`,
      [SYSTEM_ACCOUNT_ID, transaction.id, amount]
    );

    await client.query(
      `INSERT INTO ledger_entries (account_id, transaction_id, entry_type, amount)
       VALUES ($1, $2, 'credit', $3)`,
      [accountId, transaction.id, amount]
    );

    const completedRes = await client.query(
      `UPDATE transactions
       SET status = 'completed'
       WHERE id = $1
       RETURNING *`,
      [transaction.id]
    );

    await client.query('COMMIT');
    return completedRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.status) throw err;
    console.error(err);
    throw { status: 500, message: 'Internal server error' };
  } finally {
    client.release();
  }
}

// WITHDRAWAL (user -> System)
async function withdraw({ accountId, amount, currency, description }) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    await client.query(
      `SELECT id FROM accounts 
       WHERE id IN ($1, $2) FOR UPDATE`,
      [accountId, SYSTEM_ACCOUNT_ID]
    );

    const accRes = await client.query(
      'SELECT id, currency, status FROM accounts WHERE id IN ($1, $2)',
      [accountId, SYSTEM_ACCOUNT_ID]
    );
    if (accRes.rowCount !== 2) throw { status: 500, message: 'System account not configured' };

    const userAcc = accRes.rows.find(a => a.id === accountId);
    const sysAcc = accRes.rows.find(a => a.id === SYSTEM_ACCOUNT_ID);

    if (userAcc.status !== 'active') throw { status: 422, message: 'Account is not active' };
    if (userAcc.currency !== currency || sysAcc.currency !== currency) {
      throw { status: 400, message: 'Currency mismatch' };
    }

    // Check balance for overdraft
    const userBalance = await getBalanceInTx(client, accountId);
    if (Number(userBalance) < Number(amount)) {
      throw { status: 422, message: 'Insufficient funds' };
    }

    const txRes = await client.query(
      `INSERT INTO transactions 
        (tx_type, source_account_id, destination_account_id, amount, currency, status, description)
       VALUES ('withdrawal', $1, $2, $3, $4, 'pending', $5)
       RETURNING *`,
      [accountId, SYSTEM_ACCOUNT_ID, amount, currency, description || null]
    );
    const transaction = txRes.rows[0];

    // User loses (debit), system gains (credit)
    await client.query(
      `INSERT INTO ledger_entries (account_id, transaction_id, entry_type, amount)
       VALUES ($1, $2, 'debit', $3)`,
      [accountId, transaction.id, amount]
    );

    await client.query(
      `INSERT INTO ledger_entries (account_id, transaction_id, entry_type, amount)
       VALUES ($1, $2, 'credit', $3)`,
      [SYSTEM_ACCOUNT_ID, transaction.id, amount]
    );

    const completedRes = await client.query(
      `UPDATE transactions
       SET status = 'completed'
       WHERE id = $1
       RETURNING *`,
      [transaction.id]
    );

    await client.query('COMMIT');
    return completedRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.status) throw err;
    console.error(err);
    throw { status: 500, message: 'Internal server error' };
  } finally {
    client.release();
  }
}

module.exports = {
  transfer,
  deposit,
  withdraw,
};
