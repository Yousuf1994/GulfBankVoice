"use client";

import { useCallback, useEffect, useState } from "react";

type Customer = {
  id: string;
  name: string;
  preferred_languages: string[];
  email: string | null;
  mobile: string | null;
  address: string | null;
};

type Account = {
  id: string;
  customer_id: string;
  type: string;
  balance_aed: string;
  masked_iban: string;
};

type Card = {
  id: string;
  account_id: string;
  holder_name: string;
  holder_relationship: string;
  is_supplementary: boolean;
  last4: string;
  card_type: string;
  status: string;
  credit_limit_aed: string | null;
};

type Transaction = {
  id: string;
  card_id: string;
  occurred_at: string;
  amount_aed: string;
  merchant: string;
  category: string;
  city: string | null;
  country: string | null;
  channel: string;
  status: string;
  is_recurring: boolean;
};

type Dispute = {
  id: string;
  case_number: string;
  customer_id: string;
  status: string;
  refund_by_date: string | null;
};

type ServiceRequest = {
  id: string;
  customer_id: string;
  type: string;
  reference_number: string;
  status: string;
};

type HandoffTicket = {
  id: string;
  customer_id: string | null;
  reason: string;
  priority: string;
};

type AuditEntry = {
  id: string;
  created_at: string;
  who: string;
  what: string;
  result: unknown;
};

type Snapshot = {
  customers: Customer[];
  accounts: Account[];
  cards: Card[];
  transactions: Transaction[];
  disputes: Dispute[];
  serviceRequests: ServiceRequest[];
  handoffTickets: HandoffTicket[];
  auditLog: AuditEntry[];
};

const statusColors: Record<string, string> = {
  active: "text-green-700 bg-green-100",
  approved: "text-green-700 bg-green-100",
  posted: "text-green-700 bg-green-100",
  frozen: "text-amber-700 bg-amber-100",
  pending: "text-amber-700 bg-amber-100",
  blocked: "text-red-700 bg-red-100",
  declined: "text-red-700 bg-red-100",
};

function statusBadge(status: string) {
  const color = statusColors[status] ?? "text-zinc-700 bg-zinc-100";
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}

export default function Backoffice() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/snapshot", { cache: "no-store" });
      if (!res.ok) throw new Error(`Snapshot request failed (${res.status})`);
      setSnapshot(await res.json());
      setError(null);
    } catch {
      setError("Couldn't reach the mock bank. Is the database connected?");
    }
  }, []);

  useEffect(() => {
    // Polling an external system (our own API) on mount and on an interval,
    // not reacting to a React value -- the pattern this lint rule usually flags.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [refresh]);

  async function handleReset() {
    setResetting(true);
    try {
      await fetch("/api/admin/reset", { method: "POST" });
      await refresh();
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 font-sans dark:bg-black">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
              Gulf Demo Bank — Back Office
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Live view of the mock bank. Refreshes every 2 seconds.
            </p>
          </div>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            {resetting ? "Resetting…" : "Reset demo data"}
          </button>
        </div>

        {error && (
          <p className="mb-6 rounded bg-red-100 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {!snapshot && !error && (
          <p className="text-sm text-zinc-500">Loading…</p>
        )}

        {snapshot && (
          <div className="flex flex-col gap-10">
            {snapshot.customers.map((customer) => {
              const customerAccounts = snapshot.accounts.filter(
                (a) => a.customer_id === customer.id,
              );
              const accountIds = new Set(customerAccounts.map((a) => a.id));
              const customerCards = snapshot.cards.filter((c) =>
                accountIds.has(c.account_id),
              );
              const cardIds = new Set(customerCards.map((c) => c.id));
              const customerTransactions = snapshot.transactions.filter((t) =>
                cardIds.has(t.card_id),
              );
              const customerDisputes = snapshot.disputes.filter(
                (d) => d.customer_id === customer.id,
              );
              const customerRequests = snapshot.serviceRequests.filter(
                (r) => r.customer_id === customer.id,
              );
              const customerTickets = snapshot.handoffTickets.filter(
                (t) => t.customer_id === customer.id,
              );

              return (
                <section
                  key={customer.id}
                  className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
                    {customer.name}
                  </h2>
                  <p className="mb-4 text-xs text-zinc-500">
                    {customer.email} · {customer.mobile} ·{" "}
                    {customer.preferred_languages.join("/")}
                  </p>

                  {customerAccounts.length === 0 && (
                    <p className="text-sm text-zinc-500">
                      No accounts yet (prospect).
                    </p>
                  )}

                  {customerAccounts.map((account) => (
                    <div key={account.id} className="mb-3 text-sm">
                      <span className="font-medium capitalize">
                        {account.type} account
                      </span>{" "}
                      — AED {account.balance_aed} · {account.masked_iban}
                    </div>
                  ))}

                  {customerCards.length > 0 && (
                    <div className="mb-4">
                      <h3 className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Cards
                      </h3>
                      <table className="w-full text-sm">
                        <tbody>
                          {customerCards.map((card) => (
                            <tr key={card.id} className="border-t border-zinc-100 dark:border-zinc-800">
                              <td className="py-1">
                                {card.holder_name}
                                {card.is_supplementary ? " (supplementary)" : ""}
                              </td>
                              <td className="py-1 text-zinc-500">
                                •••• {card.last4}
                              </td>
                              <td className="py-1 capitalize text-zinc-500">
                                {card.card_type}
                              </td>
                              <td className="py-1">{statusBadge(card.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {customerTransactions.length > 0 && (
                    <div className="mb-4">
                      <h3 className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Transactions ({customerTransactions.length})
                      </h3>
                      <table className="w-full text-sm">
                        <tbody>
                          {customerTransactions.slice(0, 8).map((tx) => (
                            <tr key={tx.id} className="border-t border-zinc-100 dark:border-zinc-800">
                              <td className="py-1 text-zinc-500">
                                {new Date(tx.occurred_at).toLocaleString()}
                              </td>
                              <td className="py-1">{tx.merchant}</td>
                              <td className="py-1 text-zinc-500">
                                AED {tx.amount_aed}
                              </td>
                              <td className="py-1">{statusBadge(tx.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {customerTransactions.length > 8 && (
                        <p className="mt-1 text-xs text-zinc-400">
                          +{customerTransactions.length - 8} more
                        </p>
                      )}
                    </div>
                  )}

                  {(customerDisputes.length > 0 ||
                    customerRequests.length > 0 ||
                    customerTickets.length > 0) && (
                    <div className="text-sm text-zinc-500">
                      {customerDisputes.length} disputes ·{" "}
                      {customerRequests.length} service requests ·{" "}
                      {customerTickets.length} handoff tickets
                    </div>
                  )}
                </section>
              );
            })}

            <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="mb-2 text-lg font-semibold text-black dark:text-zinc-50">
                Audit log
              </h2>
              <table className="w-full text-sm">
                <tbody>
                  {snapshot.auditLog.slice(0, 20).map((entry) => (
                    <tr key={entry.id} className="border-t border-zinc-100 dark:border-zinc-800">
                      <td className="py-1 text-zinc-500">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                      <td className="py-1">{entry.who}</td>
                      <td className="py-1">{entry.what}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
