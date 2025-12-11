# Financial Ledger API — Double Entry Bookkeeping (Node.js + PostgreSQL + Docker)

A fully ACID-compliant financial ledger system implementing:

- ✔ Double-entry bookkeeping  
- ✔ Immutable ledger entries  
- ✔ Atomic SQL transactions  
- ✔ Real-time balance calculation  
- ✔ PostgreSQL row-level locking  
- ✔ Docker-based deployment  

This system is built to mimic real-world banking ledger behavior with correctness, safety, and auditability.

---

## 🚀 Features

### ✔ Double-Entry Bookkeeping
Every financial event creates two ledger entries:

- **Debit** from one account  
- **Credit** to another account  

This keeps the books balanced at all times.

---

### ✔ ACID Transactions
Each operation runs inside a single SQL transaction:

```
BEGIN
  validate inputs
  lock accounts
  insert ledger entries
  update transaction status
COMMIT
```

If any step fails → **ROLLBACK**

---

### ✔ Immutable Ledger  
Ledger entries **cannot be updated or deleted**.

A PostgreSQL trigger enforces immutability:

```
BEFORE UPDATE OR DELETE → RAISE EXCEPTION
```

---

### ✔ Real-Time Balance Calculation
Balance is calculated dynamically:

```
SUM(credits) – SUM(debits)
```

No stored balance → no corruption → complete auditability.

---

### ✔ Prevent Negative Balances
During withdrawals/transfers:

1. Lock account row (`SELECT ... FOR UPDATE`)
2. Compute balance
3. Reject if `balance < amount`

Prevents overdrafts or race conditions.

---

## 🏗️ Tech Stack

| Component | Technology |
|----------|------------|
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Isolation Level | SERIALIZABLE |
| Deployment | Docker + Docker Compose |
| Testing | Postman |
| UUID | pgcrypto extension |

---

## 📂 Project Structure

```
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
```

---

## ⚙️ Running the Project (Docker Recommended)

### ✅ 1. Clone Repository
```bash
git clone https://github.com/sivanandu-03/financial-ledger-api-23P31A05C0
cd financial-ledger-api-23P31A05C0
```

### ✅ 2. Create `.env`
```bash
cp .env.example .env
```

Example:
```
DATABASE_URL=postgres://postgres:postgres@db:5432/ledger_db
SYSTEM_ACCOUNT_ID=00000000-0000-0000-0000-000000000001
PORT=3000
```

### ✅ 3. Start API + Database
```bash
docker-compose up --build
```

Expected:
```
ledger-db   | PostgreSQL init process complete  
ledger-api  | Server listening on port 3000
```

API URL:  
👉 http://localhost:3000

---

## ⚙️ Running Without Docker (Optional)

### Install Dependencies
```bash
npm install
```

### Create Database
```sql
CREATE DATABASE ledger_db;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Apply Schema  
Run `schema.sql`

### Start Server
```bash
node server.js
```

---

## 🧪 API Testing (Postman)

Import:

```
financial-ledger-api.postman_collection.json
```

### ✔ Create Account  
POST `/accounts`
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "accountType": "checking",
  "currency": "INR"
}
```

### ✔ Deposit  
POST `/deposits`
```json
{
  "accountId": "<ACCOUNT_ID>",
  "amount": 1000,
  "currency": "INR",
  "description": "Initial deposit"
}
```

### ✔ Withdrawal  
POST `/withdrawals`

### ✔ Transfer  
POST `/transfers`

### ✔ Get Account Details  
GET `/accounts/<ACCOUNT_ID>`

### ✔ Get Ledger  
GET `/accounts/<ACCOUNT_ID>/ledger`

---

## 🛡️ Ledger Immutability Test
```sql
UPDATE ledger_entries SET amount = 999 WHERE amount = 1000;
```

Expected output:
```
ERROR: Ledger entries are immutable
```

---

## 🧠 Design Decisions

### Double-Entry Implementation
Each transaction creates:

- 1 debit entry  
- 1 credit entry  

Ensures the ledger always balances.

---

### ACID Compliance
- **Atomicity:** All steps succeed or none  
- **Consistency:** Constraints prevent invalid data  
- **Isolation:** `FOR UPDATE` prevents double spending  
- **Durability:** WAL logs preserve data  

---

### Transaction Isolation Level: SERIALIZABLE  
Prevents:

- Lost updates  
- Concurrent withdrawals  
- Race conditions  

---

### Dynamic Balance Calculation  
```
balance = SUM(credits) - SUM(debits)
```

Prevents data corruption since no balance is stored.

---

### Negative Balance Prevention  
- Lock row  
- Compute balance  
- Abort transaction if insufficient funds  

---

## 🏛️ Architecture Overview

```
Client
  ↓
Routes (Express)
  ↓
Services (Business Logic)
  ↓
Database (accounts, transactions, ledger_entries)
  ↓
PostgreSQL Trigger (immutability)
```

---

## 🗄️ ERD (Schema Overview)

```
accounts (1) ────< transactions >──── (1) accounts
       │                         │
       │                         │
       └──────< ledger_entries >──────┘
```

### Tables:
- accounts  
- transactions  
- ledger_entries  

### Relationships:
- transactions → accounts (source_account_id)  
- transactions → accounts (destination_account_id)  
- ledger_entries → accounts  
- ledger_entries → transactions  

---

