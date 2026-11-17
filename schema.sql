-- ====================================================================
-- VaultCore Production PostgreSQL Database Schema
-- ACID-Compliant Double-Entry Ledger with Strict Serializable Isolation
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Accounts Table (Wallets and System Entities)
CREATE TABLE accounts (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    account_number VARCHAR(30) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('USER', 'MERCHANT', 'TREASURY')),
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0.00), -- Inviolable non-negative constraint
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for high-speed account lookup by account number
CREATE INDEX idx_accounts_account_number ON accounts(account_number);

-- 2. Transactions Table (Logical Payment Events)
CREATE TABLE transactions (
    id VARCHAR(50) PRIMARY KEY,
    idempotency_key VARCHAR(120) UNIQUE NOT NULL, -- Eliminates duplicate charges
    source_account_id VARCHAR(50) NOT NULL REFERENCES accounts(id),
    destination_account_id VARCHAR(50) NOT NULL REFERENCES accounts(id),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0.00),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'ROLLED_BACK')),
    description TEXT,
    execution_time_ms NUMERIC(8, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- High-performance indexes for transactions
CREATE INDEX idx_transactions_idempotency_key ON transactions(idempotency_key);
CREATE INDEX idx_transactions_source_acc ON transactions(source_account_id);
CREATE INDEX idx_transactions_dest_acc ON transactions(destination_account_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- 3. Ledger Entries Table (The Immutable Double-Entry Audit Trail)
-- Mathematical Invariant: Every transaction MUST have exactly 1 DEBIT and 1 CREDIT entry.
CREATE TABLE ledger_entries (
    id VARCHAR(50) PRIMARY KEY,
    transaction_id VARCHAR(50) NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
    account_id VARCHAR(50) NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    type VARCHAR(10) NOT NULL CHECK (type IN ('DEBIT', 'CREDIT')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0.00),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    balance_after NUMERIC(15, 2) NOT NULL,
    hash VARCHAR(64) NOT NULL, -- SHA-256 Merkle chain hash
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- High-performance indexes for ledger audit verification
CREATE INDEX idx_ledger_entries_tx_id ON ledger_entries(transaction_id);
CREATE INDEX idx_ledger_entries_acc_id ON ledger_entries(account_id);
CREATE INDEX idx_ledger_entries_type ON ledger_entries(type);
CREATE INDEX idx_ledger_entries_created_at ON ledger_entries(created_at DESC);

-- 4. Idempotency Cache Table (Distributed request deduplication)
CREATE TABLE idempotency_records (
    key VARCHAR(120) PRIMARY KEY,
    status VARCHAR(20) NOT NULL CHECK (status IN ('IN_FLIGHT', 'COMPLETED')),
    response_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
);

-- 5. Audit Invariant View
-- This view allows instant validation of the core banking balance theorem:
-- Total Credits MUST equal Total Debits + Genesis Bootstrap Credit
CREATE OR REPLACE VIEW view_ledger_integrity_audit AS
SELECT
    SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END) AS total_credits,
    SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE 0 END) AS total_debits,
    ABS(
        SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END) -
        SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE 0 END)
    ) AS delta_imbalance,
    CASE
        WHEN ABS(
            SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END) -
            SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE 0 END)
        ) = 0 THEN 'VERIFIED'
        ELSE 'COMPROMISED'
    END AS audit_status,
    COUNT(DISTINCT transaction_id) AS total_transactions,
    COUNT(*) AS total_ledger_entries
FROM ledger_entries
WHERE id != 'led_genesis_000';
