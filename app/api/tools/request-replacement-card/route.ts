import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireToolSecret } from "@/lib/toolAuth";
import { logAudit } from "@/lib/auditLog";
import { hasValidVerification } from "@/lib/verification";
import { getOwnedCard, randomLast4 } from "@/lib/cards";
import { query } from "@/lib/db";

/** Noor's request_replacement_card tool (PRD.md 6.2). */
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
      result: { error: true, message: "This needs a fresh approval. Ask for a new approval before issuing a replacement." },
    });
  }

  const oldCard = await getOwnedCard(customer_id, card_id);
  if (!oldCard) {
    return NextResponse.json({ result: { error: true, message: "Could not find that card for this customer." } });
  }

  if (oldCard.status !== "blocked") {
    await query(`UPDATE cards SET status = 'blocked' WHERE id = $1`, [card_id]);
  }

  const newId = randomUUID();
  const newLast4 = randomLast4();
  await query(
    `INSERT INTO cards (id, account_id, holder_name, holder_relationship, is_supplementary, last4, card_type, status, credit_limit_aed)
     SELECT $1, account_id, holder_name, holder_relationship, is_supplementary, $2, card_type, 'active', credit_limit_aed
     FROM cards WHERE id = $3`,
    [newId, newLast4, card_id],
  );

  await logAudit(customer_id, "request_replacement_card", { old_card_id: card_id, new_card_id: newId, new_last4: newLast4 });

  return NextResponse.json({
    result: `A replacement card ending ${newLast4} will arrive in 3 to 5 working days.`,
  });
}
