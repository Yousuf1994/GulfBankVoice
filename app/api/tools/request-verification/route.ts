import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { query } from "@/lib/db";
import { requireToolSecret } from "@/lib/toolAuth";
import { logAudit } from "@/lib/auditLog";
import { PENDING_TIMEOUT_MS } from "@/lib/verification";

/**
 * Noor's request_verification tool (PRD.md 6.1). Sends a simulated approval
 * prompt to the customer's app. Level 1 = read, level 2 = change.
 */
export async function POST(request: NextRequest) {
  const authError = requireToolSecret(request);
  if (authError) return authError;

  const body = await request.json();
  const { customer_id, level } = body.parameters ?? {};

  if (!customer_id || (level !== 1 && level !== 2)) {
    return NextResponse.json({
      result: { error: true, message: "customer_id and level (1 or 2) are required." },
    });
  }

  const id = randomUUID();
  const expiresAt = new Date(Date.now() + PENDING_TIMEOUT_MS).toISOString();

  await query(
    `INSERT INTO verifications (id, customer_id, level, status, expires_at)
     VALUES ($1, $2, $3, 'pending', $4)`,
    [id, customer_id, level, expiresAt],
  );

  await logAudit(customer_id, "request_verification", { verification_id: id, level });

  return NextResponse.json({
    result: `Sent a level ${level} approval request to the customer's app. verification_id: ${id}. Ask the customer to approve it, then check back with check_verification.`,
  });
}
