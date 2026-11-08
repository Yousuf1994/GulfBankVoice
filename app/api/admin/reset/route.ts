import { NextResponse } from "next/server";
import { resetDemoData } from "@/db/seed";
import { logAudit } from "@/lib/auditLog";

/**
 * Powers the "Reset demo data" button on /backoffice. Not one of Noor's tools,
 * so it doesn't need the X-Tool-Secret header -- it's a page-admin action, not
 * something the agent calls.
 */
export async function POST() {
  await resetDemoData();
  await logAudit("backoffice", "reset_demo_data", { ok: true });
  return NextResponse.json({ ok: true });
}
