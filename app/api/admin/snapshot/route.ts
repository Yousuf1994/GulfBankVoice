import { NextResponse } from "next/server";
import { io } from "next/cache";
import { query } from "@/lib/db";

/**
 * Feeds the /backoffice page everything it displays, in one call so the
 * 2-second poll there stays simple. Not one of Noor's tools.
 */
export async function GET() {
  // Marks this route as reading live data, so Next doesn't try to prerender
  // it at build time (it has no dynamic route segment to do that for us).
  await io();

  const [
    customers,
    accounts,
    cards,
    transactions,
    disputes,
    serviceRequests,
    handoffTickets,
    auditLog,
  ] = await Promise.all([
    query(`SELECT * FROM customers ORDER BY id`),
    query(`SELECT * FROM accounts ORDER BY id`),
    query(`SELECT * FROM cards ORDER BY id`),
    query(`SELECT * FROM transactions ORDER BY occurred_at DESC`),
    query(`SELECT * FROM disputes ORDER BY created_at DESC`),
    query(`SELECT * FROM service_requests ORDER BY created_at DESC`),
    query(`SELECT * FROM handoff_tickets ORDER BY created_at DESC`),
    query(`SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100`),
  ]);

  return NextResponse.json({
    customers,
    accounts,
    cards,
    transactions,
    disputes,
    serviceRequests,
    handoffTickets,
    auditLog,
  });
}
