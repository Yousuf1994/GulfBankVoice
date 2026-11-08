"use client";

import { useCallback, useEffect, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";

const PERSONAS = [
  { id: "ahmed", label: "Ahmed Al Mansoori" },
  { id: "priya", label: "Priya Nair" },
  { id: "maria", label: "Maria Santos" },
] as const;

type TranscriptEntry = { role: "user" | "ai"; message: string };
type ToolActivityEntry = {
  toolCallId: string;
  toolName: string;
  state: "calling" | "done" | "error";
  result?: string;
};
type PendingVerification = { id: string; level: number } | null;

export default function CallPage() {
  return (
    <ConversationProvider>
      <CallPageInner />
    </ConversationProvider>
  );
}

function CallPageInner() {
  const [personaId, setPersonaId] = useState<(typeof PERSONAS)[number]["id"]>("ahmed");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [toolActivity, setToolActivity] = useState<ToolActivityEntry[]>([]);
  const [pending, setPending] = useState<PendingVerification>(null);
  const [callError, setCallError] = useState<string | null>(null);

  const { startSession, endSession, status } = useConversation({
    onMessage: ({ message, source }) => {
      setTranscript((t) => [...t, { role: source, message }]);
    },
    onAgentToolRequest: (props) => {
      setToolActivity((a) => [
        ...a,
        { toolCallId: props.tool_call_id, toolName: props.tool_name, state: "calling" },
      ]);
    },
    onAgentToolResponse: (props) => {
      setToolActivity((a) =>
        a.map((item) =>
          item.toolCallId === props.tool_call_id
            ? {
                ...item,
                state: props.is_error ? "error" : "done",
                result: "full_tool_result" in props ? props.full_tool_result : item.result,
              }
            : item,
        ),
      );
    },
    onError: (message) => setCallError(message),
  });

  const connected = status === "connected";

  const refreshPending = useCallback(async () => {
    try {
      const res = await fetch(`/api/customers/${personaId}/verifications/pending`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setPending(data.pending);
    } catch {
      // Polling failure isn't fatal -- just try again next tick.
    }
  }, [personaId]);

  useEffect(() => {
    // Polling our own API for a pending approval, not reacting to a React value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshPending();
    const interval = setInterval(refreshPending, 2000);
    return () => clearInterval(interval);
  }, [refreshPending]);

  async function handleTalk() {
    setCallError(null);
    setTranscript([]);
    setToolActivity([]);
    try {
      const res = await fetch(`/api/elevenlabs/signed-url?customer_id=${personaId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Could not start the call (${res.status}).`);
      }
      const { signedUrl, customerId, customerName } = await res.json();
      startSession({
        signedUrl,
        dynamicVariables: { customer_id: customerId, customer_name: customerName },
      });
    } catch (err) {
      setCallError(err instanceof Error ? err.message : "Could not start the call.");
    }
  }

  async function respondToApproval(action: "approve" | "deny") {
    if (!pending) return;
    await fetch(`/api/verifications/${pending.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setPending(null);
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 font-sans dark:bg-black">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Gulf Demo Bank — Talk to Noor
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Pick who you are, then press Talk to us.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPersonaId(p.id)}
              disabled={connected}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                personaId === p.id
                  ? "bg-foreground text-background"
                  : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              } disabled:opacity-50`}
            >
              {p.label}
            </button>
          ))}

          {!connected ? (
            <button
              onClick={handleTalk}
              className="ml-auto rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Talk to us
            </button>
          ) : (
            <button
              onClick={() => endSession()}
              className="ml-auto rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              End call
            </button>
          )}
        </div>

        {callError && (
          <p className="rounded bg-red-100 px-4 py-2 text-sm text-red-700">{callError}</p>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <section className="rounded-lg border border-zinc-200 bg-white p-5 md:col-span-2 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Live transcript
            </h2>
            <div className="flex flex-col gap-2">
              {transcript.length === 0 && (
                <p className="text-sm text-zinc-400">Nothing yet.</p>
              )}
              {transcript.map((entry, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    entry.role === "user"
                      ? "ml-auto bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black"
                      : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  }`}
                >
                  {entry.message}
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-col gap-6">
            <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Gulf Demo Bank app
              </h2>
              {pending ? (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    Approve {pending.level === 2 ? "a change" : "reading your account"}?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respondToApproval("approve")}
                      className="flex-1 rounded-full bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => respondToApproval("deny")}
                      className="flex-1 rounded-full bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-400">No pending approvals.</p>
              )}
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Tool activity
              </h2>
              <div className="flex flex-col gap-2">
                {toolActivity.length === 0 && (
                  <p className="text-sm text-zinc-400">Nothing yet.</p>
                )}
                {toolActivity.map((entry) => (
                  <div key={entry.toolCallId} className="text-xs">
                    <span className="font-mono font-medium">{entry.toolName}</span>{" "}
                    {entry.state === "calling" && <span className="text-zinc-400">running…</span>}
                    {entry.state === "done" && <span className="text-green-600">done</span>}
                    {entry.state === "error" && <span className="text-red-600">error</span>}
                    {entry.result && (
                      <p className="mt-0.5 text-zinc-500">{entry.result}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
