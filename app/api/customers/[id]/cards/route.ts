import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireToolSecret } from "@/lib/toolAuth";
import { logAudit } from "@/lib/auditLog";

type CardRow = {
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

/** Noor's "list cards" tool. See PRD.md section 6.1 and 6.2. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = requireToolSecret(request);
  if (authError) return authError;

  const { id } = await params;
  const cards = await query<CardRow>(
    `SELECT c.id, c.account_id, c.holder_name, c.holder_relationship, c.is_supplementary,
            c.last4, c.card_type, c.status, c.credit_limit_aed
     FROM cards c
     JOIN accounts a ON a.id = c.account_id
     WHERE a.customer_id = $1
     ORDER BY c.id`,
    [id],
  );

  await logAudit(id, "list_cards", { count: cards.length });
  return NextResponse.json(cards);
}
