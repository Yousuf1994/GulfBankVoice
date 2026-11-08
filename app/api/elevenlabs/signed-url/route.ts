import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { query } from "@/lib/db";
import { io } from "next/cache";

type CustomerRow = { id: string; name: string };

/**
 * Creates the signed URL a call connects through, so the ElevenLabs API key
 * never reaches the browser (CLAUDE.md security rule). Takes customer_id from
 * the page's persona picker and looks the customer up server-side -- this is
 * what "identity comes from the page session" means for a demo without real
 * login: the page can only pick from customers that actually exist.
 */
export async function GET(request: NextRequest) {
  await io();

  const customerId = request.nextUrl.searchParams.get("customer_id");
  if (!customerId) {
    return NextResponse.json({ error: "customer_id is required." }, { status: 400 });
  }

  const rows = await query<CustomerRow>(`SELECT id, name FROM customers WHERE id = $1`, [customerId]);
  const customer = rows[0];
  if (!customer) {
    return NextResponse.json({ error: "Unknown customer." }, { status: 404 });
  }

  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!agentId) {
    return NextResponse.json({ error: "Server is missing ELEVENLABS_AGENT_ID." }, { status: 500 });
  }

  const client = new ElevenLabsClient();
  const { signedUrl } = await client.conversationalAi.conversations.getSignedUrl({ agentId });

  return NextResponse.json({
    signedUrl,
    customerId: customer.id,
    customerName: customer.name,
  });
}
