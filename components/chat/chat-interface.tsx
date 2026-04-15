"use client";

import { useChat } from "ai/react";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import {
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  FileText,
  Calculator,
  Receipt,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ChatMessage, TypingIndicator } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ChatHistory, type ChatSessionSummary } from "./chat-history";
import { CHAT_LOCALES, type ChatLocale, isChatLocale } from "@/types/chat";

const CHAT_LOCALE_STORAGE_KEY = "taxsense-chat-locale";

const GREETINGS: Record<ChatLocale, string> = {
  en:
    "Hello! I'm your TaxSense AI assistant, specialized in US federal and California state income taxes.\n\nI can help you understand tax concepts, filing requirements, deductions, credits, and IRS/FTB procedures. Ask me anything — and I'll answer based on the most relevant IRS and FTB guidance.\n\nWhat would you like to know?",
  es:
    "¡Hola! Soy su asistente de IA TaxSense, especializado en impuestos federales de EE. UU. y estatales de California sobre la renta.\n\nPuedo ayudarle a entender conceptos tributarios, requisitos de declaración, deducciones, créditos y procedimientos del IRS y la FTB. Pregunte lo que quiera: responderé con base en la guía del IRS y la FTB más relevante.\n\n¿Qué le gustaría saber?",
};

function makeGreetingMessage(locale: ChatLocale, id = "greeting") {
  return {
    id,
    role: "assistant" as const,
    content: GREETINGS[locale],
  };
}

const EXAMPLE_PROMPTS: Record<
  ChatLocale,
  { icon: LucideIcon; label: string; prompt: string }[]
> = {
  en: [
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
  ],
  es: [
    {
      icon: Receipt,
      label: "Ingresos 1099-NEC",
      prompt: "¿Cómo declaro mis ingresos del 1099-NEC en California?",
    },
    {
      icon: Calculator,
      label: "Deducción oficina en casa",
      prompt: "¿Qué deducciones de oficina en casa puedo reclamar como autónomo?",
    },
    {
      icon: FileText,
      label: "EITC de California",
      prompt: "¿Soy elegible para el Crédito tributario por ingreso del trabajo de California?",
    },
    {
      icon: TrendingUp,
      label: "Ganancias de capital",
      prompt: "¿Cómo trata California las ganancias de capital distinto al nivel federal?",
    },
  ],
};

const UI: Record<
  ChatLocale,
  {
    conversations: string;
    hideHistory: string;
    showHistory: string;
    assistantTitle: string;
    assistantSubtitle: string;
    ragBadge: string;
    welcomeTitle: string;
    welcomeSubtitle: string;
    welcomeFooter: string;
    loadingConversation: string;
  }
> = {
  en: {
    conversations: "Conversations",
    hideHistory: "Hide history",
    showHistory: "Show history",
    assistantTitle: "Tax Assistant",
    assistantSubtitle: "Federal & California · Tax Year 2025",
    ragBadge: "RAG-grounded",
    welcomeTitle: "What can I help you with?",
    welcomeSubtitle:
      "Ask anything about US federal or California state taxes — deductions, credits, forms, deadlines.",
    welcomeFooter:
      "For informational purposes only · Not a substitute for a licensed CPA",
    loadingConversation: "Loading conversation…",
  },
  es: {
    conversations: "Conversaciones",
    hideHistory: "Ocultar historial",
    showHistory: "Mostrar historial",
    assistantTitle: "Asistente fiscal",
    assistantSubtitle: "Federal y California · Año fiscal 2025",
    ragBadge: "Basado en RAG",
    welcomeTitle: "¿En qué puedo ayudarle?",
    welcomeSubtitle:
      "Pregunte sobre impuestos federales de EE. UU. o estatales de California: deducciones, créditos, formularios, plazos.",
    welcomeFooter:
      "Solo con fines informativos · No sustituye a un CPA colegiado",
    loadingConversation: "Cargando conversación…",
  },
};

export function ChatInterface() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [locale, setLocale] = useState<ChatLocale>("en");
  const [clientReady, setClientReady] = useState(false);
  // #region agent log — debug error capture
  const [debugError, setDebugError] = useState<string | null>(null);
  // #endregion
  const bottomRef = useRef<HTMLDivElement>(null);

  const chatBody = useMemo(
    () => ({ locale, ...(sessionId ? { sessionId } : {}) }),
    [locale, sessionId],
  );

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
    body: chatBody,
    initialMessages: [makeGreetingMessage("en")],
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
      toast.error(
        locale === "es"
          ? "No se pudo obtener una respuesta. Inténtelo de nuevo."
          : "Failed to get a response. Please try again.",
      );
    },
  });

  useEffect(() => {
    const stored = localStorage.getItem(CHAT_LOCALE_STORAGE_KEY);
    if (stored && isChatLocale(stored)) {
      setLocale(stored);
    }
    setClientReady(true);
  }, []);

  useEffect(() => {
    if (!clientReady) return;
    localStorage.setItem(CHAT_LOCALE_STORAGE_KEY, locale);
  }, [locale, clientReady]);

  useEffect(() => {
    if (!clientReady) return;
    setMessages((prev) => {
      const hasUser = prev.some((m) => m.role === "user");
      if (hasUser) return prev;
      const content = GREETINGS[locale];
      const first = prev[0];
      if (first?.role === "assistant" && first.content === content) return prev;
      const id =
        first?.role === "assistant" && String(first.id).startsWith("greeting")
          ? first.id
          : "greeting";
      const rest =
        first?.role === "assistant" && String(first.id).startsWith("greeting")
          ? prev.slice(1)
          : prev;
      return [{ id, role: "assistant" as const, content }, ...rest];
    });
  }, [locale, clientReady, setMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const ui = UI[locale];
  const examplePrompts = EXAMPLE_PROMPTS[locale];

  const handleNewChat = useCallback(() => {
    setSessionId(null);
    setMessages([
      makeGreetingMessage(locale, "greeting-" + Date.now()),
    ]);
  }, [setMessages, locale]);

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
          }),
        );
        setSessionId(session.id);
        setMessages([makeGreetingMessage(locale), ...loaded]);
      } catch {
        toast.error(
          locale === "es"
            ? "No se pudo cargar la conversación. Inténtelo de nuevo."
            : "Could not load conversation. Please try again.",
        );
      } finally {
        setLoadingHistory(false);
      }
    },
    [sessionId, setMessages, locale],
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
            {ui.conversations}
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <ChatHistory
            activeSessionId={sessionId}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewChat}
            refreshKey={historyRefreshKey}
            locale={locale}
          />
        </div>
      </aside>

      {/* ── Main chat area ──────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col bg-background">

        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
              className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex"
              aria-label={historyOpen ? ui.hideHistory : ui.showHistory}
            >
              {historyOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </button>

            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20">
                <Bot className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{ui.assistantTitle}</p>
                <p className="truncate text-[10px] text-muted-foreground/60">{ui.assistantSubtitle}</p>
              </div>
            </div>
          </div>

          <div className="ml-2 flex shrink-0 items-center gap-2">
            <div
              className="flex rounded-lg border border-border p-0.5"
              role="group"
              aria-label={locale === "es" ? "Idioma de la respuesta" : "Response language"}
            >
              {CHAT_LOCALES.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code)}
                  className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                    locale === code
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>

            <div className="hidden items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-[10px] text-muted-foreground">{ui.ragBadge}</span>
            </div>
          </div>
        </header>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto">
          {loadingHistory ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
                <p className="text-sm text-muted-foreground">{ui.loadingConversation}</p>
              </div>
            </div>
          ) : !userHasSent ? (
            /* ── Welcome screen ── */
            <div className="flex h-full flex-col items-center justify-center px-5 pb-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-foreground">
                {ui.welcomeTitle}
              </h2>
              <p className="mb-8 max-w-sm text-center text-sm text-muted-foreground">
                {ui.welcomeSubtitle}
              </p>

              <div className="grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
                {examplePrompts.map(({ icon: Icon, label, prompt }) => (
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
                {ui.welcomeFooter}
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
            <button type="button" onClick={() => setDebugError(null)} className="mt-2 text-[10px] text-orange-600 underline">dismiss</button>
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
          locale={locale}
        />
      </div>
    </div>
  );
}
