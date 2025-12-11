Financial Ledger API — Double Entry Bookkeeping (Node.js + PostgreSQL + Docker)

This project implements a fully ACID-compliant financial ledger system using:

✔ Double-entry bookkeeping
✔ Immutable ledger entries
✔ SQL transactions for atomicity
✔ Real-time balance calculation
✔ PostgreSQL row-level locking
✔ Docker-based deployment

This system is designed to mimic real-world banking ledger behavior.

🚀 Features
✔ Double-Entry Bookkeeping

Every financial event generates two ledger entries:

Debit from one account

Credit to another account

This guarantees the books always balance.

✔ ACID Transactions

Each operation runs inside a single SQL transaction:

BEGIN
  validate inputs
  lock accounts
  insert ledger entries
  update transaction status
COMMIT


If any step fails → ROLLBACK.

✔ Immutable Ledger

Ledger entries cannot be changed or deleted.
A PostgreSQL trigger enforces immutability:

BEFORE UPDATE OR DELETE → RAISE EXCEPTION

✔ Real-Time Balance Calculation

Balance is never stored. It is computed as:

SUM(credits) – SUM(debits)


This guarantees full auditability.

✔ Prevent Negative Balances

Before a withdrawal or transfer:

The account row is locked (SELECT ... FOR UPDATE)

The available balance is checked

If insufficient → transaction fails safely

No double spending or race conditions

🏗️ Tech Stack
Component	Technology
Backend	Node.js + Express
Database	PostgreSQL
Isolation Level	SERIALIZABLE (recommended)
Containerization	Docker + Docker Compose
Testing	Postman
UUID	pgcrypto extension
📂 Project Structure
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
  server.js
  package.json
  financial-ledger-api.postman_collection.json
  README.md

⚙️ Running the Project (Docker Recommended)
✅ 1. Clone the repository
git clone https://github.com/sivanandu-03/financial-ledger-api-23P31A05C0
cd financial-ledger-api-23P31A05C0

✅ 2. Create .env
cp .env.example .env


Example content:

DATABASE_URL=postgres://postgres:postgres@db:5432/ledger_db
SYSTEM_ACCOUNT_ID=00000000-0000-0000-0000-000000000001
PORT=3000

✅ 3. Start the system (API + PostgreSQL)
docker-compose up --build


Expected output:

ledger-db  | PostgreSQL init process complete
ledger-api | Server listening on port 3000


API available at:

👉 http://localhost:3000

⚙️ Running Without Docker (Optional)

Install dependencies

npm install


Create PostgreSQL database

CREATE DATABASE ledger_db;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


Apply schema
Load schema.sql

Start server

node server.js

🧪 API Testing (Using Postman)

Import the provided collection:

financial-ledger-api.postman_collection.json

✔ 1. Create Account

POST /accounts

{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "accountType": "checking",
  "currency": "INR"
}

✔ 2. Deposit

POST /deposits

{
  "accountId": "<ACCOUNT_ID>",
  "amount": 1000,
  "currency": "INR",
  "description": "Initial deposit"
}

✔ 3. Withdrawal

POST /withdrawals

✔ 4. Transfer

POST /transfers

✔ 5. Get Account Details

GET /accounts/<ACCOUNT_ID>

✔ 6. Get Account Ledger

GET /accounts/<ACCOUNT_ID>/ledger

🛡️ Ledger Immutability Test
UPDATE ledger_entries SET amount = 999 WHERE amount = 1000;


Expected:

ERROR: Ledger entries are immutable

🧠 Design Decisions
✔ Double-Entry Implementation

Every transaction creates:

One debit ledger entry

One credit ledger entry

Ledger entries reference the transactions table for full traceability.

✔ Ensuring ACID Properties

Atomicity: All inserts happen inside a single SQL transaction.

Consistency: Schema constraints + checks prevent invalid data.

Isolation: FOR UPDATE locking prevents concurrent double spending.

Durability: PostgreSQL writes to disk WAL logs.

✔ Transaction Isolation Level

Recommended level: SERIALIZABLE

Prevents:

Lost updates

Double withdrawals

Race conditions

Ensures banking-grade consistency.

✔ Balance Calculation

Balance = (credits sum) – (debits sum)
No balance column exists → prevents corruption.

✔ Preventing Negative Balances

During withdrawal/transfer:

Lock account row (FOR UPDATE)

Compute balance

If balance < amount → abort transaction

Ensures no overdrafts.

🏛️ Architecture Diagram
Client
   ↓
Routes (Express)
   ↓
Services (Business Logic)
   ↓
Database (accounts, transactions, ledger_entries)
   ↓
Ledger Trigger (immutability)

🗄️ ERD (Database Schema Diagram)
accounts (1) ────< transactions >──── (1) accounts
       │                         │
       │                         │
       └──────< ledger_entries >──────┘


Tables:

accounts

transactions

ledger_entries

Relationships:

transactions → accounts (source_account_id)

transactions → accounts (destination_account_id)

ledger_entries → accounts

ledger_entries → transactions