import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { query } from "@/lib/db";
import { requireToolSecret } from "@/lib/toolAuth";
import { logAudit } from "@/lib/auditLog";

/** Noor's create_handoff_ticket tool (PRD.md 6.1) -- logs a callback request for a human. */
export async function POST(request: NextRequest) {
  const authError = requireToolSecret(request);
  if (authError) return authError;

  const body = await request.json();
  const { customer_id, reason, summary, priority } = body.parameters ?? {};

  if (!customer_id || !reason || !summary) {
    return NextResponse.json({
      result: { error: true, message: "customer_id, reason, and summary are required." },
    });
  }

  const id = randomUUID();
  await query(
    `INSERT INTO handoff_tickets (id, customer_id, reason, summary, priority)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, customer_id, reason, summary, priority ?? "normal"],
  );

  await logAudit(customer_id, "create_handoff_ticket", { id, reason, priority: priority ?? "normal" });

  return NextResponse.json({
    result: `Logged a callback request for a human agent, reference ${id.slice(0, 8).toUpperCase()}.`,
  });
}
