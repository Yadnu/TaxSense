"use client";

import { useChat } from "ai/react";
import { useRef, useEffect, useState, useCallback } from "react";
import {
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  FileText,
  Calculator,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { ChatMessage, TypingIndicator } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ChatHistory, type ChatSessionSummary } from "./chat-history";

const EXAMPLE_PROMPTS = [
  {
    icon: Receipt,
    label: "1099-NEC income",
    prompt: "How do I report my 1099-NEC income in California?",
  },
  {
    icon: Calculator,
    label: "Home office deduction",
    prompt: "What home office deductions can I claim as a freelancer?",
  },
  {
    icon: FileText,
    label: "California EITC",
    prompt: "Am I eligible for the California Earned Income Tax Credit?",
  },
  {
    icon: TrendingUp,
    label: "Capital gains",
    prompt: "How does California treat capital gains differently from federal?",
  },
];

const GREETING =
  "Hello! I'm your TaxSense AI assistant, specialized in US federal and California state income taxes.\n\nI can help you understand tax concepts, filing requirements, deductions, credits, and IRS/FTB procedures. Ask me anything — and I'll answer based on the most relevant IRS and FTB guidance.\n\nWhat would you like to know?";

const GREETING_MESSAGE = {
  id: "greeting",
  role: "assistant" as const,
  content: GREETING,
};

export function ChatInterface() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);
  // #region agent log — debug error capture
  const [debugError, setDebugError] = useState<string | null>(null);
  // #endregion
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    append,
    error,
  } = useChat({
    api: "/api/chat",
    body: sessionId ? { sessionId } : {},
    initialMessages: [GREETING_MESSAGE],
    onResponse: (response) => {
      const id = response.headers.get("x-session-id");
      if (id && !sessionId) {
        setSessionId(id);
        setHistoryRefreshKey((k) => k + 1);
      }
    },
    onFinish: () => {
      setHistoryRefreshKey((k) => k + 1);
    },
    onError: (err) => {
      // #region agent log — debug error capture
      const msg = `[onError] ${err?.message ?? String(err)} | name: ${(err as Error)?.name} | stack: ${(err as Error)?.stack?.slice(0, 300)}`;
      setDebugError(msg);
      console.error("[ChatInterface onError]", err);
      // #endregion
      toast.error("Failed to get a response. Please try again.");
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleNewChat = useCallback(() => {
    setSessionId(null);
    setMessages([{ ...GREETING_MESSAGE, id: "greeting-" + Date.now() }]);
  }, [setMessages]);

  const handleSelectSession = useCallback(
    async (session: ChatSessionSummary) => {
      if (session.id === sessionId) return;
      setLoadingHistory(true);
      try {
        const res = await fetch(`/api/chat/sessions/${session.id}/messages`);
        if (!res.ok) throw new Error("Failed to load session");
        const data = await res.json();
        const loaded = data.messages.map(
          (m: { id: string; role: string; content: string }) => ({
            id: m.id,
            role: m.role.toLowerCase() as "user" | "assistant",
            content: m.content,
          })
        );
        setSessionId(session.id);
        setMessages([GREETING_MESSAGE, ...loaded]);
      } catch {
        toast.error("Could not load conversation. Please try again.");
      } finally {
        setLoadingHistory(false);
      }
    },
    [sessionId, setMessages]
  );

  const handleExamplePrompt = async (prompt: string) => {
    if (isLoading) return;
    // #region agent log — debug error capture
    setDebugError(null);
    try {
      await append({ role: "user", content: prompt });
    } catch (err) {
      const msg = `[append threw] ${(err as Error)?.message ?? String(err)} | name: ${(err as Error)?.name} | stack: ${(err as Error)?.stack?.slice(0, 300)}`;
      setDebugError(msg);
      console.error("[ChatInterface handleExamplePrompt]", err);
    }
    // #endregion
  };

  const userHasSent = messages.some((m) => m.role === "user");

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-background">

      {/* ── History sidebar ─────────────────────────────────────────── */}
      <aside
        className={`hidden flex-col bg-card transition-all duration-300 ease-in-out lg:flex ${
          historyOpen ? "w-64 border-r border-border" : "w-0 overflow-hidden"
        }`}
      >
        <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Conversations
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <ChatHistory
            activeSessionId={sessionId}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewChat}
            refreshKey={historyRefreshKey}
          />
        </div>
      </aside>

      {/* ── Main chat area ──────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col bg-background">

        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
              className="hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex"
              aria-label={historyOpen ? "Hide history" : "Show history"}
            >
              {historyOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20">
                <Bot className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Tax Assistant</p>
                <p className="text-[10px] text-muted-foreground/60">Federal &amp; California · Tax Year 2025</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="hidden text-[10px] text-muted-foreground sm:block">RAG-grounded</span>
          </div>
        </header>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto">
          {loadingHistory ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
                <p className="text-sm text-muted-foreground">Loading conversation…</p>
              </div>
            </div>
          ) : !userHasSent ? (
            /* ── Welcome screen ── */
            <div className="flex h-full flex-col items-center justify-center px-5 pb-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-foreground">
                What can I help you with?
              </h2>
              <p className="mb-8 max-w-sm text-center text-sm text-muted-foreground">
                Ask anything about US federal or California state taxes — deductions, credits, forms, deadlines.
              </p>

              <div className="grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
                {EXAMPLE_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleExamplePrompt(prompt)}
                    disabled={isLoading}
                    className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-border/80 hover:bg-muted/40 disabled:opacity-50"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-blue-500 dark:text-blue-400 transition-colors group-hover:bg-muted/80">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{prompt}</p>
                    </div>
                  </button>
                ))}
              </div>

              <p className="mt-8 text-[11px] text-muted-foreground/40">
                For informational purposes only · Not a substitute for a licensed CPA
              </p>
            </div>
          ) : (
            /* ── Message thread ── */
            <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6">
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role as "user" | "assistant"}
                  content={msg.content}
                  isStreaming={
                    isLoading &&
                    idx === messages.length - 1 &&
                    msg.role === "assistant"
                  }
                />
              ))}

              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <TypingIndicator />
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex-shrink-0 border-t border-destructive/20 bg-destructive/10 px-5 py-2">
            <p className="text-xs text-destructive">{error.message}</p>
          </div>
        )}

        {/* #region agent log — debug error panel */}
        {debugError && (
          <div className="flex-shrink-0 border-t-2 border-orange-400 bg-orange-50 dark:bg-orange-950 px-5 py-3">
            <p className="mb-1 text-xs font-bold text-orange-700 dark:text-orange-300">DEBUG ERROR (copy this):</p>
            <pre className="whitespace-pre-wrap break-all text-[10px] text-orange-800 dark:text-orange-200 select-all">{debugError}</pre>
            <button onClick={() => setDebugError(null)} className="mt-2 text-[10px] text-orange-600 underline">dismiss</button>
          </div>
        )}
        {/* #endregion */}

        {/* Input */}
        <ChatInput
          input={input}
          isLoading={isLoading}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          showDisclaimer={userHasSent}
        />
      </div>
    </div>
  );
}
