import { query } from "./db";

export type CardRow = {
  id: string;
  account_id: string;
  holder_name: string;
  holder_relationship: string;
  is_supplementary: boolean;
  last4: string;
  card_type: "credit" | "debit";
  status: "active" | "frozen" | "blocked";
  credit_limit_aed: string | null;
};

/** Looks up a card only if it belongs to this customer, to stop cross-customer tampering. */
export async function getOwnedCard(customerId: string, cardId: string): Promise<CardRow | undefined> {
  const rows = await query<CardRow>(
    `SELECT c.* FROM cards c
     JOIN accounts a ON a.id = c.account_id
     WHERE c.id = $1 AND a.customer_id = $2`,
    [cardId, customerId],
  );
  return rows[0];
}

/** A fresh 4-digit card ending for a newly issued card. Not guaranteed globally unique -- fine for demo data. */
export function randomLast4(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}
