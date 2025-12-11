# Financial Ledger API — Double Entry Bookkeeping (Node.js + PostgreSQL + Docker)

This project implements a fully ACID-compliant Financial Ledger System using
✔ Double-entry bookkeeping
✔ Immutable ledger
✔ Transaction-level consistency
✔ Real-time balance calculation

It follows banking-style accounting principles and ensures data integrity even under concurrency.

## 🚀 Features
✔ Double-Entry Bookkeeping

Every financial action creates two ledger entries:

Debit from one account

Credit to another

This guarantees balanced books.

✔ ACID Transactions

Deposits, withdrawals, and transfers run inside a single SQL transaction:

BEGIN → VALIDATE → INSERT LEDGER ENTRIES → COMMIT


If any step fails:

ROLLBACK

✔ Immutable Ledger

Ledger entries cannot be edited or deleted.
A PostgreSQL trigger enforces immutability.

✔ Real-Time Balance Calculation

Balance is not stored in the accounts table.
Instead:

Balance = SUM(credits) – SUM(debits)


This ensures full auditability.

✔ Prevent Negative Balances

Withdrawals & transfers use:

Row-level locking (FOR UPDATE)

Balance checks inside the transaction

Negative balances are impossible.

✔ Clean Architecture
routes/     → HTTP API endpoints
services/   → Business logic & transactions
schema.sql  → Database schema + triggers
db.js       → PostgreSQL connection pool

## 🏗️ Tech Stack
Component	Technology
Backend	Node.js + Express
Database	PostgreSQL
Containerization	Docker + Docker Compose
API Testing	Postman
Transactions	SERIALIZABLE isolation (recommended)
## 📂 Project Structure
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
  Dockerfile
  docker-compose.yml
  .env.example
  package.json
  server.js
  README.md

# ⚙️ Running the Project (Docker Recommended)

Your evaluator can run the entire application using one command — no Node.js or PostgreSQL required.

## ✅ 1. Clone the Repository
git clone https://github.com/<username>/financial-ledger-api.git
cd financial-ledger-api

## ✅ 2. Create .env from template
cp .env.example .env


Content (example):

DATABASE_URL=postgres://postgres:postgres@db:5432/ledger_db
PORT=3000

## ✅ 3. Start Services (API + PostgreSQL)
docker-compose up --build


If successful, you will see:

ledger-db  | PostgreSQL init process complete
ledger-api | Server listening on port 3000


The API now runs at:

👉 http://localhost:3000

# ⚙️ Running Without Docker (Manual Setup)

(Not required but included for completeness.)

1️⃣ Install dependencies
npm install

2️⃣ Create PostgreSQL DB
CREATE DATABASE ledger_db;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

3️⃣ Load schema

Import schema.sql.

4️⃣ Start server
node server.js

# 🧪 API Testing Guide (Using Postman)

Import the provided file:

financial-ledger-api.postman_collection.json


Then test endpoints.

## ✔ 1. Create Account

POST /accounts

{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "accountType": "checking",
  "currency": "INR"
}

## ✔ 2. Deposit

POST /deposits

{
  "accountId": "<ACCOUNT_ID>",
  "amount": 1000,
  "currency": "INR",
  "description": "Initial deposit"
}

## ✔ 3. Withdrawal

POST /withdrawals

{
  "accountId": "<ACCOUNT_ID>",
  "amount": 200,
  "currency": "INR",
  "description": "ATM withdrawal"
}

## ✔ 4. Transfer

POST /transfers

{
  "sourceAccountId": "A_ID",
  "destinationAccountId": "B_ID",
  "amount": 300,
  "currency": "INR",
  "description": "Bill payment"
}

## ✔ 5. Get Account Balance

GET /accounts/<ACCOUNT_ID>

## ✔ 6. Get Ledger

GET /accounts/<ACCOUNT_ID>/ledger

# 🛡️ Ledger Immutability Test

Try:

UPDATE ledger_entries SET amount = 999 WHERE amount = 1000;


Expected:

ERROR: Ledger entries are immutable