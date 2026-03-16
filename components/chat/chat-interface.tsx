"use client";

import { useChat } from "ai/react";
import { useRef, useEffect, useState } from "react";
import { Bot, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ChatMessage, TypingIndicator } from "./chat-message";
import { ChatInput } from "./chat-input";

const EXAMPLE_PROMPTS = [
  "Am I eligible for the California Earned Income Tax Credit?",
  "What home office deductions can I claim as a freelancer?",
  "How do I report my 1099-NEC income in California?",
  "What is the standard deduction for California in 2025?",
  "Can I deduct student loan interest on my California return?",
  "How does California treat capital gains differently from federal?",
];

const GREETING =
  "Hello! I'm your TaxSense AI assistant, specialized in US federal and California state income taxes.\n\nI can help you understand tax concepts, filing requirements, deductions, credits, and IRS/FTB procedures. Ask me anything — and I'll answer based on the most relevant IRS and FTB guidance.\n\nWhat would you like to know?";

export function ChatInterface() {
  const [sessionId, setSessionId] = useState<string | null>(null);
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
    // Merge sessionId into every request body so the server can continue
    // the same DB session across turns.
    body: sessionId ? { sessionId } : {},
    initialMessages: [
      {
        id: "greeting",
        role: "assistant",
        content: GREETING,
      },
    ],
    onResponse: (response) => {
      // Capture the session ID returned by the server on the first turn
      const id = response.headers.get("x-session-id");
      if (id && !sessionId) setSessionId(id);
    },
    onError: () => {
      toast.error("Failed to get a response. Please try again.");
    },
  });

  // Scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Start a fresh conversation
  const handleNewConversation = () => {
    setSessionId(null);
    setMessages([
      {
        id: "greeting-" + Date.now(),
        role: "assistant",
        content: GREETING,
      },
    ]);
  };

  // Send one of the example prompts
  const handleExamplePrompt = async (prompt: string) => {
    if (isLoading) return;
    await append({ role: "user", content: prompt });
  };

  // Only show example prompts before the user has sent any message
  const userHasSent = messages.some((m) => m.role === "user");

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:h-[calc(100vh-3.5rem)]">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="page-header flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900 text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">
                Tax Assistant
              </h1>
              <p className="text-xs text-gray-500">
                US Federal &amp; California · RAG-grounded · Tax Year 2025
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleNewConversation}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-slate-100 hover:text-gray-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            New conversation
          </button>
        </div>
      </div>

      {/* ── Disclaimer banner ─────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-amber-200 bg-amber-50 px-5 py-2">
        <p className="flex items-center gap-1.5 text-xs text-amber-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          For informational purposes only. Not a substitute for advice from a
          licensed CPA or tax attorney.
        </p>
      </div>

      {/* ── Message list ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-5">
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          {messages.map((msg, idx) => (
            <ChatMessage
              key={msg.id}
              role={msg.role as "user" | "assistant"}
              content={msg.content}
              // Mark the last assistant message as streaming while loading
              isStreaming={
                isLoading &&
                idx === messages.length - 1 &&
                msg.role === "assistant"
              }
            />
          ))}

          {/* Show typing indicator when waiting for the first token */}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <TypingIndicator />
          )}

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Example prompts (shown before the first user message) ────── */}
      {!userHasSent && !isLoading && (
        <div className="flex-shrink-0 border-t border-slate-200 bg-white px-5 py-3">
          <p className="mb-2 text-xs font-medium text-gray-400">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.slice(0, 4).map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleExamplePrompt(prompt)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-blue-900 hover:bg-blue-50 hover:text-blue-900"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Error banner ──────────────────────────────────────────────── */}
      {error && (
        <div className="flex-shrink-0 border-t border-red-200 bg-red-50 px-5 py-2">
          <p className="text-xs text-red-700">{error.message}</p>
        </div>
      )}

      {/* ── Input ─────────────────────────────────────────────────────── */}
      <ChatInput
        input={input}
        isLoading={isLoading}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
