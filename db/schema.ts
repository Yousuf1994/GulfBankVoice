/**
 * Mock bank schema, from PRD.md section 9. Run by db/seed.ts before every
 * seed/reset, so a brand-new database bootstraps itself on first reset.
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  preferred_languages TEXT[] NOT NULL DEFAULT '{}',
  email TEXT,
  mobile TEXT,
  address TEXT
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('current', 'salary', 'savings')),
  balance_aed NUMERIC(12,2) NOT NULL,
  masked_iban TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  holder_name TEXT NOT NULL,
  holder_relationship TEXT NOT NULL DEFAULT 'self',
  is_supplementary BOOLEAN NOT NULL DEFAULT FALSE,
  last4 TEXT NOT NULL,
  card_type TEXT NOT NULL CHECK (card_type IN ('credit', 'debit')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'blocked')),
  credit_limit_aed NUMERIC(12,2)
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL,
  amount_aed NUMERIC(12,2) NOT NULL,
  merchant TEXT NOT NULL,
  category TEXT NOT NULL,
  city TEXT,
  country TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('online', 'in_store')),
  status TEXT NOT NULL CHECK (status IN ('approved', 'declined', 'pending', 'posted')),
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS disputes (
  id TEXT PRIMARY KEY,
  case_number TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  transaction_ids TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  refund_by_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_requests (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  reference_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verifications (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level IN (1, 2)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  prospect_name TEXT NOT NULL,
  mobile TEXT,
  email TEXT,
  product TEXT,
  documents JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'started',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS handoff_tickets (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  summary TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  who TEXT NOT NULL,
  what TEXT NOT NULL,
  result JSONB
);
`;
