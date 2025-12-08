-- 1. accounts
CREATE TABLE accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    account_type    VARCHAR(20) NOT NULL CHECK (account_type IN ('checking', 'savings')),
    currency        CHAR(3) NOT NULL,
    status          VARCHAR(20) NOT NULL CHECK (status IN ('active', 'frozen', 'closed')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional: "system" or "bank" account for deposits/withdrawals
-- Create a special row and remember its id in config or env.
-- Example (you can insert manually after migration):
-- INSERT INTO accounts (id, user_id, account_type, currency, status)
-- VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
--         'checking', 'INR', 'active');

-- 2. transactions
CREATE TABLE transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_type         VARCHAR(20) NOT NULL CHECK (tx_type IN ('transfer', 'deposit', 'withdrawal')),
    source_account_id UUID NULL REFERENCES accounts(id),
    destination_account_id UUID NULL REFERENCES accounts(id),
    amount          NUMERIC(18,2) NOT NULL CHECK (amount > 0),
    currency        CHAR(3) NOT NULL,
    status          VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ledger_entries (immutable)
CREATE TABLE ledger_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    transaction_id  UUID NOT NULL REFERENCES transactions(id),
    entry_type      VARCHAR(10) NOT NULL CHECK (entry_type IN ('debit', 'credit')),
    amount          NUMERIC(18,2) NOT NULL CHECK (amount > 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Do NOT allow UPDATE/DELETE on ledger_entries (immutability)
-- Easiest: no UPDATE/DELETE in code. Stronger: DB triggers:

CREATE OR REPLACE FUNCTION prevent_ledger_mutation()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'Ledger entries are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ledger_no_update
BEFORE UPDATE OR DELETE ON ledger_entries
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();
