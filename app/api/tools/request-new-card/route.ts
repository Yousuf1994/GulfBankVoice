import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireToolSecret } from "@/lib/toolAuth";
import { logAudit } from "@/lib/auditLog";
import { hasValidVerification } from "@/lib/verification";
import { randomLast4 } from "@/lib/cards";
import { query } from "@/lib/db";

type AccountRow = { id: string };

/**
 * Noor's request_new_card tool (PRD.md 6.2) -- an additional card (e.g. a new
 * supplementary card), not tied to replacing an existing one. Looks up the
 * customer's account itself rather than trusting an account_id parameter.
 */
export async function POST(request: NextRequest) {
  const authError = requireToolSecret(request);
  if (authError) return authError;

  const body = await request.json();
  const { customer_id, card_type, holder_name, holder_relationship } = body.parameters ?? {};

  if (!customer_id || !card_type || !holder_name) {
    return NextResponse.json({
      result: { error: true, message: "customer_id, card_type, and holder_name are required." },
    });
  }

  if (!(await hasValidVerification(customer_id, 2))) {
    return NextResponse.json({
      result: { error: true, message: "This needs a fresh approval. Ask for a new approval before issuing a new card." },
    });
  }

  const accounts = await query<AccountRow>(`SELECT id FROM accounts WHERE customer_id = $1 LIMIT 1`, [customer_id]);
  const account = accounts[0];
  if (!account) {
    return NextResponse.json({ result: { error: true, message: "This customer has no account to attach a card to." } });
  }

  const relationship = holder_relationship ?? "self";
  const newId = randomUUID();
  const newLast4 = randomLast4();
  await query(
    `INSERT INTO cards (id, account_id, holder_name, holder_relationship, is_supplementary, last4, card_type, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')`,
    [newId, account.id, holder_name, relationship, relationship !== "self", newLast4, card_type],
  );

  await logAudit(customer_id, "request_new_card", { new_card_id: newId, new_last4: newLast4, card_type, holder_name });

  return NextResponse.json({
    result: `A new ${card_type} card ending ${newLast4} for ${holder_name} will arrive in 3 to 5 working days.`,
  });
}
