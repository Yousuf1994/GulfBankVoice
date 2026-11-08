import { NextRequest, NextResponse } from "next/server";
import { requireToolSecret } from "@/lib/toolAuth";
import { logAudit } from "@/lib/auditLog";
import { hasValidVerification } from "@/lib/verification";
import { getOwnedCard } from "@/lib/cards";
import { query } from "@/lib/db";

/**
 * Noor's block_card tool (PRD.md 6.2) -- permanent block for lost/stolen/damaged
 * cards. PRD acceptance: a permanent block always offers a replacement, so the
 * spoken result nudges toward that; Noor still asks before calling the
 * replacement tool.
 */
export async function POST(request: NextRequest) {
  const authError = requireToolSecret(request);
  if (authError) return authError;

  const body = await request.json();
  const { customer_id, card_id, reason } = body.parameters ?? {};

  if (!customer_id || !card_id || !reason) {
    return NextResponse.json({
      result: { error: true, message: "customer_id, card_id, and reason are required." },
    });
  }

  if (!(await hasValidVerification(customer_id, 2))) {
    return NextResponse.json({
      result: { error: true, message: "This needs a fresh approval. Ask for a new approval before blocking the card." },
    });
  }

  const card = await getOwnedCard(customer_id, card_id);
  if (!card) {
    return NextResponse.json({ result: { error: true, message: "Could not find that card for this customer." } });
  }

  await query(`UPDATE cards SET status = 'blocked' WHERE id = $1`, [card_id]);
  await logAudit(customer_id, "block_card", { card_id, last4: card.last4, reason });

  return NextResponse.json({
    result: `Card ending ${card.last4} has been permanently blocked. Offer the customer a replacement card now.`,
  });
}
