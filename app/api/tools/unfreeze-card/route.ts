import { NextRequest, NextResponse } from "next/server";
import { requireToolSecret } from "@/lib/toolAuth";
import { logAudit } from "@/lib/auditLog";
import { hasValidVerification } from "@/lib/verification";
import { getOwnedCard } from "@/lib/cards";
import { query } from "@/lib/db";

/** Noor's unfreeze_card tool (PRD.md 6.2). */
export async function POST(request: NextRequest) {
  const authError = requireToolSecret(request);
  if (authError) return authError;

  const body = await request.json();
  const { customer_id, card_id } = body.parameters ?? {};

  if (!customer_id || !card_id) {
    return NextResponse.json({ result: { error: true, message: "customer_id and card_id are required." } });
  }

  if (!(await hasValidVerification(customer_id, 2))) {
    return NextResponse.json({
      result: { error: true, message: "This needs a fresh approval. Ask for a new approval before unfreezing the card." },
    });
  }

  const card = await getOwnedCard(customer_id, card_id);
  if (!card) {
    return NextResponse.json({ result: { error: true, message: "Could not find that card for this customer." } });
  }

  await query(`UPDATE cards SET status = 'active' WHERE id = $1`, [card_id]);
  await logAudit(customer_id, "unfreeze_card", { card_id, last4: card.last4 });

  return NextResponse.json({ result: `Card ending ${card.last4} is active again.` });
}
