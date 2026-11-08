import { query, rawQuery } from "@/lib/db";
import { SCHEMA_SQL } from "./schema";

/** Day/hour offsets from "now", so the demo always looks current. See PRD.md section 9. */
function daysAgo(n: number, hour = 12, minute = 0): string {
  const d = new Date();
  d.setUTCHours(hour, minute, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 60 * 60 * 1000).toISOString();
}

type Customer = {
  id: string;
  name: string;
  preferred_languages: string[];
  email: string;
  mobile: string;
  address: string;
};

type Account = {
  id: string;
  customer_id: string;
  type: "current" | "salary" | "savings";
  balance_aed: number;
  masked_iban: string;
};

type Card = {
  id: string;
  account_id: string;
  holder_name: string;
  holder_relationship: string;
  is_supplementary: boolean;
  last4: string;
  card_type: "credit" | "debit";
  status: "active" | "frozen" | "blocked";
  credit_limit_aed: number | null;
};

type Transaction = {
  id: string;
  card_id: string;
  occurred_at: string;
  amount_aed: number;
  merchant: string;
  category: string;
  city: string | null;
  country: string | null;
  channel: "online" | "in_store";
  status: "approved" | "declined" | "pending" | "posted";
  is_recurring: boolean;
};

const customers: Customer[] = [
  {
    id: "ahmed",
    name: "Ahmed Al Mansoori",
    preferred_languages: ["ar", "en"],
    email: "ahmed.almansoori@example.com",
    mobile: "+971501234567",
    address: "Jumeirah, Dubai, UAE",
  },
  {
    id: "priya",
    name: "Priya Nair",
    preferred_languages: ["en", "hi"],
    email: "priya.nair@example.com",
    mobile: "+971507654321",
    address: "Khalifa City, Abu Dhabi, UAE",
  },
  {
    id: "maria",
    name: "Maria Santos",
    preferred_languages: ["en"],
    email: "maria.santos@example.com",
    mobile: "+971509876543",
    address: "Not yet a customer",
  },
];

const accounts: Account[] = [
  {
    id: "ahmed-acc-1",
    customer_id: "ahmed",
    type: "current",
    balance_aed: 18250.75,
    masked_iban: "AE** **** **** **** 1234",
  },
  {
    id: "priya-acc-1",
    customer_id: "priya",
    type: "salary",
    balance_aed: 9540.2,
    masked_iban: "AE** **** **** **** 5678",
  },
];

const cards: Card[] = [
  {
    id: "ahmed-card-1",
    account_id: "ahmed-acc-1",
    holder_name: "Ahmed Al Mansoori",
    holder_relationship: "self",
    is_supplementary: false,
    last4: "4821",
    card_type: "credit",
    status: "active",
    credit_limit_aed: 25000,
  },
  {
    id: "ahmed-card-2",
    account_id: "ahmed-acc-1",
    holder_name: "Fatima Al Mansoori",
    holder_relationship: "spouse",
    is_supplementary: true,
    last4: "7734",
    card_type: "credit",
    status: "active",
    credit_limit_aed: null,
  },
  {
    id: "priya-card-1",
    account_id: "priya-acc-1",
    holder_name: "Priya Nair",
    holder_relationship: "self",
    is_supplementary: false,
    last4: "5521",
    card_type: "debit",
    status: "active",
    credit_limit_aed: null,
  },
];

const transactions: Transaction[] = [
  // Ahmed's recurring subscriptions: Netflix and Spotify going back ~6 months.
  ...[5, 4, 3, 2, 1, 0].map((monthsAgo, i) => ({
    id: `ahmed-tx-netflix-${i}`,
    card_id: "ahmed-card-1",
    occurred_at: daysAgo(monthsAgo * 30 + 2, 9, 15),
    amount_aed: 37.99,
    merchant: "Netflix",
    category: "entertainment",
    city: null,
    country: null,
    channel: "online" as const,
    status: "posted" as const,
    is_recurring: true,
  })),
  ...[5, 4, 3, 2, 1, 0].map((monthsAgo, i) => ({
    id: `ahmed-tx-spotify-${i}`,
    card_id: "ahmed-card-1",
    occurred_at: daysAgo(monthsAgo * 30 + 6, 10, 0),
    amount_aed: 19.99,
    merchant: "Spotify",
    category: "entertainment",
    city: null,
    country: null,
    channel: "online" as const,
    status: "posted" as const,
    is_recurring: true,
  })),
  // Gym membership started 3 months ago.
  ...[2, 1, 0].map((monthsAgo, i) => ({
    id: `ahmed-tx-gym-${i}`,
    card_id: "ahmed-card-1",
    occurred_at: daysAgo(monthsAgo * 30 + 10, 7, 30),
    amount_aed: 299,
    merchant: "FitZone Gym",
    category: "fitness",
    city: "Dubai",
    country: "UAE",
    channel: "in_store" as const,
    status: "posted" as const,
    is_recurring: true,
  })),
  // A duplicate restaurant charge, two minutes apart.
  {
    id: "ahmed-tx-restaurant-1",
    card_id: "ahmed-card-1",
    occurred_at: daysAgo(47, 20, 10),
    amount_aed: 185,
    merchant: "Left Bank Restaurant",
    category: "dining",
    city: "Dubai",
    country: "UAE",
    channel: "in_store",
    status: "posted",
    is_recurring: false,
  },
  {
    id: "ahmed-tx-restaurant-2",
    card_id: "ahmed-card-1",
    occurred_at: daysAgo(47, 20, 12),
    amount_aed: 185,
    merchant: "Left Bank Restaurant",
    category: "dining",
    city: "Dubai",
    country: "UAE",
    channel: "in_store",
    status: "posted",
    is_recurring: false,
  },
  // Yesterday's declined online attempt at an unfamiliar overseas merchant.
  {
    id: "ahmed-tx-fraud-1",
    card_id: "ahmed-card-1",
    occurred_at: daysAgo(1, 23, 42),
    amount_aed: 2450,
    merchant: "QuickBuy Electronics",
    category: "shopping",
    city: "Unknown",
    country: "Unknown",
    channel: "online",
    status: "declined",
    is_recurring: false,
  },
  // A Carrefour charge on Fatima's supplementary card.
  {
    id: "ahmed-tx-carrefour-1",
    card_id: "ahmed-card-2",
    occurred_at: daysAgo(5, 18, 20),
    amount_aed: 312,
    merchant: "Carrefour",
    category: "groceries",
    city: "Dubai",
    country: "UAE",
    channel: "in_store",
    status: "posted",
    is_recurring: false,
  },
  // A few everyday transactions for realism.
  {
    id: "ahmed-tx-fuel-1",
    card_id: "ahmed-card-1",
    occurred_at: daysAgo(12, 8, 0),
    amount_aed: 120,
    merchant: "ADNOC",
    category: "fuel",
    city: "Dubai",
    country: "UAE",
    channel: "in_store",
    status: "posted",
    is_recurring: false,
  },
  {
    id: "ahmed-tx-grocery-1",
    card_id: "ahmed-card-1",
    occurred_at: daysAgo(20, 19, 0),
    amount_aed: 410,
    merchant: "Spinneys",
    category: "groceries",
    city: "Dubai",
    country: "UAE",
    channel: "in_store",
    status: "posted",
    is_recurring: false,
  },

  // Priya's everyday transactions.
  {
    id: "priya-tx-grocery-1",
    card_id: "priya-card-1",
    occurred_at: daysAgo(9, 18, 30),
    amount_aed: 215,
    merchant: "Carrefour",
    category: "groceries",
    city: "Abu Dhabi",
    country: "UAE",
    channel: "in_store",
    status: "posted",
    is_recurring: false,
  },
  {
    id: "priya-tx-dining-1",
    card_id: "priya-card-1",
    occurred_at: daysAgo(3, 20, 0),
    amount_aed: 95,
    merchant: "Café Bateel",
    category: "dining",
    city: "Abu Dhabi",
    country: "UAE",
    channel: "in_store",
    status: "posted",
    is_recurring: false,
  },
  // The false decline abroad, 2 hours ago (really her).
  {
    id: "priya-tx-istanbul-1",
    card_id: "priya-card-1",
    occurred_at: hoursAgo(2),
    amount_aed: 460,
    merchant: "Grand Bazaar Textiles",
    category: "shopping",
    city: "Istanbul",
    country: "Turkey",
    channel: "in_store",
    status: "declined",
    is_recurring: false,
  },
];

const TABLES_IN_DELETE_ORDER = [
  "audit_log",
  "handoff_tickets",
  "applications",
  "verifications",
  "service_requests",
  "disputes",
  "transactions",
  "cards",
  "accounts",
  "customers",
];

/** Rebuilds the schema (if needed) and reloads the three demo personas. */
export async function resetDemoData() {
  await rawQuery(SCHEMA_SQL);

  await rawQuery(`TRUNCATE ${TABLES_IN_DELETE_ORDER.join(", ")} CASCADE`);

  for (const c of customers) {
    await query(
      `INSERT INTO customers (id, name, preferred_languages, email, mobile, address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [c.id, c.name, c.preferred_languages, c.email, c.mobile, c.address],
    );
  }

  for (const a of accounts) {
    await query(
      `INSERT INTO accounts (id, customer_id, type, balance_aed, masked_iban)
       VALUES ($1, $2, $3, $4, $5)`,
      [a.id, a.customer_id, a.type, a.balance_aed, a.masked_iban],
    );
  }

  for (const c of cards) {
    await query(
      `INSERT INTO cards (id, account_id, holder_name, holder_relationship, is_supplementary, last4, card_type, status, credit_limit_aed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        c.id,
        c.account_id,
        c.holder_name,
        c.holder_relationship,
        c.is_supplementary,
        c.last4,
        c.card_type,
        c.status,
        c.credit_limit_aed,
      ],
    );
  }

  for (const t of transactions) {
    await query(
      `INSERT INTO transactions (id, card_id, occurred_at, amount_aed, merchant, category, city, country, channel, status, is_recurring)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        t.id,
        t.card_id,
        t.occurred_at,
        t.amount_aed,
        t.merchant,
        t.category,
        t.city,
        t.country,
        t.channel,
        t.status,
        t.is_recurring,
      ],
    );
  }
}
