import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireToolSecret } from "@/lib/toolAuth";
import { logAudit } from "@/lib/auditLog";
import { hasValidVerification } from "@/lib/verification";
import type { CardRow } from "@/lib/cards";

/** Noor's list_cards tool (PRD.md 6.2). Reading account data needs level 1+. */
export async function POST(request: NextRequest) {
  const authError = requireToolSecret(request);
  if (authError) return authError;

  const body = await request.json();
  const { customer_id } = body.parameters ?? {};

  if (!customer_id) {
    return NextResponse.json({ result: { error: true, message: "customer_id is required." } });
  }

  if (!(await hasValidVerification(customer_id, 1))) {
    return NextResponse.json({
      result: { error: true, message: "Not verified yet. Ask the customer to approve in their app first." },
    });
  }

  const cards = await query<CardRow>(
    `SELECT c.id, c.holder_name, c.holder_relationship, c.is_supplementary, c.last4,
            c.card_type, c.status, c.account_id
     FROM cards c
     JOIN accounts a ON a.id = c.account_id
     WHERE a.customer_id = $1
     ORDER BY c.id`,
    [customer_id],
  );

  await logAudit(customer_id, "list_cards", { count: cards.length });
  return NextResponse.json({ result: cards });
}
