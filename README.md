Financial Ledger API — Double Entry Bookkeeping (Node.js + PostgreSQL)

This project implements a fully ACID-compliant Financial Ledger API using double-entry bookkeeping, immutable ledger entries, and real-time balance calculation using ledger sums.
It is designed for banking-style accuracy, data integrity, and auditability.

🚀 Features
✔ Double-entry bookkeeping

Every financial operation creates two ledger entries:

Debit from one account

Credit to another

✔ ACID Transactions

Transfers, deposits, and withdrawals run inside:
BEGIN → VALIDATION → LEDGER ENTRIES → STATUS UPDATE → COMMIT
If anything fails → ROLLBACK.

✔ Immutable Ledger

Ledger entries cannot be updated or deleted.
A PostgreSQL trigger enforces immutability.

✔ Balance is NOT stored

Balance is calculated dynamically:

SUM(credits) - SUM(debits)


This ensures a completely auditable and tamper-proof system.

✔ Prevent overdrafts

System checks balance inside the database transaction using row-level locking.
Negative balances are never allowed.

✔ Clean architecture

routes/ → API endpoints

services/ → business logic

db.js → PostgreSQL connection

schema.sql → database schema

🏗️ Tech Stack
Component	Technology
Backend	Node.js, Express.js
Database	PostgreSQL (NUMERIC for money)
Auth	(Not included, optional extension)
Deployment	Any Node host (Render, Railway, AWS, etc.)

📦 Project Structure
financial-ledger-api/
  src/
    app.js
    db.js
    routes/
      accounts.js
      transactions.js
    services/
      accountService.js
      transactionService.js
  schema.sql
  server.js
  .env        (ignored by git)
  .gitignore
  package.json

⚙️ Setup Instructions
1️⃣ Install Dependencies
npm install

2️⃣ Setup PostgreSQL Database

Create DB:

CREATE DATABASE ledger_db;


Enable UUID:

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


Run the schema:

-- Import schema.sql into your database


Create system account (used for deposits/withdrawals):

INSERT INTO accounts (id, user_id, account_type, currency, status)
VALUES ('00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000000',
        'checking', 'INR', 'active');

3️⃣ Configure Environment Variables

Create a .env file (Git will ignore it automatically):

DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/ledger_db
SYSTEM_ACCOUNT_ID=00000000-0000-0000-0000-000000000001
PORT=3000

4️⃣ Start the Server
node server.js


Server output:

Server running on port 3000

🧪 API Testing Guide

This is the exact order recommended:

✔ 1. Create Account
POST /accounts
{
  "userId": "UUID",
  "accountType": "checking",
  "currency": "INR"
}


You get:

"id": "<ACCOUNT_ID>"


Save this ID for deposits / transfers.

✔ 2. Deposit Money
POST /deposits
{
  "accountId": "<ACCOUNT_ID>",
  "amount": 1000,
  "currency": "INR"
}


Creates:

system account → debit 1000

your account → credit 1000

✔ 3. Transfer Between Accounts
POST /transfers
{
  "sourceAccountId": "A_ID",
  "destinationAccountId": "B_ID",
  "amount": 400,
  "currency": "INR"
}


Ledger entries:

Account	Entry	Amount
A	debit	400
B	credit	400
✔ 4. Withdrawal
POST /withdrawals
{
  "accountId": "A_ID",
  "amount": 100,
  "currency": "INR"
}

✔ 5. Get Account Balance
GET /accounts/A_ID


Balance is computed from ledger.

✔ 6. Get Account Ledger History
GET /accounts/A_ID/ledger

🔒 Ledger Immutability Test

Try:

UPDATE ledger_entries SET amount = 999 WHERE amount = 1000;


Expected:

ERROR: Ledger entries are immutable


Trigger is working.